// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import { EventEmitter } from "events";
import debug from "debug";
import * as awarenessProtocol from "y-protocols/awareness";
import * as Y from "yjs";

import type { RealtimeChannel } from "@supabase/realtime-js";
import { REALTIME_LISTEN_TYPES } from "@supabase/realtime-js/src/RealtimeChannel";
import type { SupabaseClient } from "@supabase/supabase-js";

export const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
    return btoa(String.fromCharCode(...bytes));
};

export const base64ToUint8Array = (base64: string): Uint8Array => {
    return new Uint8Array(
        atob(base64)
            .split("")
            .map((c) => c.charCodeAt(0)),
    );
};

export interface SupabaseProviderConfig {
    channel: string;
    awareness?: awarenessProtocol.Awareness;
    resyncInterval?: number | false;
    /** Debounce interval in ms for document updates before broadcasting to peers. Defaults to 500ms. */
    updateDebounceMs?: number;
    /** Debounce interval in ms for awareness updates before broadcasting to peers. Defaults to 1000ms. */
    awarenessDebounceMs?: number;
    /** Debounce interval in ms for persisting the document via `save`. Defaults to 1000ms. */
    saveDebounceMs?: number;
    load: () => Promise<Uint8Array | null>;
    save: (content: Uint8Array) => Promise<void>;
}

export default class SupabaseProvider extends EventEmitter {
    public awareness: awarenessProtocol.Awareness;
    public connected = false;
    private channel: RealtimeChannel | null = null;

    private _synced = false;
    private resyncInterval: ReturnType<typeof setInterval> | undefined;
    protected logger: debug.Debugger;
    public readonly id: number;

    public version = 0;

    // Debounced update state
    private pendingUpdate: Uint8Array | null = null;
    private updateTimer: ReturnType<typeof setTimeout> | null = null;

    // Debounced awareness state
    private pendingAwarenessUpdate: Uint8Array | null = null;
    private awarenessTimer: ReturnType<typeof setTimeout> | null = null;

    // Debounced save state
    private saveTimer: ReturnType<typeof setTimeout> | null = null;

    isOnline(online?: boolean): boolean {
        if (!online && online !== false) return this.connected;
        this.connected = online;
        return this.connected;
    }

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    onDocumentUpdate(update: Uint8Array, origin: any) {
        if (origin !== this) {
            // Merge consecutive updates and debounce broadcasting to reduce
            // the total number of realtime messages.
            if (this.pendingUpdate) {
                this.pendingUpdate = Y.mergeUpdates([
                    this.pendingUpdate,
                    update,
                ]);
            } else {
                this.pendingUpdate = update;
            }

            if (this.updateTimer) {
                clearTimeout(this.updateTimer);
            }

            const delay = this.config.updateDebounceMs ?? 500;

            this.updateTimer = setTimeout(() => {
                const merged = this.pendingUpdate;
                this.pendingUpdate = null;

                if (!merged) return;

                this.logger(
                    "document updated locally, broadcasting debounced update to peers",
                    this.isOnline(),
                );
                this.emit("message", merged);
                this.scheduleSave();
            }, delay);
        }
    }

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    onAwarenessUpdate({ added, updated, removed }: any, _origin: any) {
        const changedClients = added.concat(updated).concat(removed);
        const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(
            this.awareness,
            changedClients,
        );
        // Debounce awareness broadcasts to avoid spamming presence updates.
        if (this.awarenessTimer) {
            clearTimeout(this.awarenessTimer);
        }

        // For awareness it's usually fine if the latest update wins, so we
        // simply keep the last encoded update and send it after the delay.
        this.pendingAwarenessUpdate = awarenessUpdate;

        const delay = this.config.awarenessDebounceMs ?? 1000;

        this.awarenessTimer = setTimeout(() => {
            const pending = this.pendingAwarenessUpdate;
            this.pendingAwarenessUpdate = null;
            if (!pending) return;
            this.emit("awareness", pending);
        }, delay);
    }

    removeSelfFromAwarenessOnUnload() {
        awarenessProtocol.removeAwarenessStates(this.awareness, [
            this.doc.clientID,
        ], "window unload");
    }

    async save() {
        const content = Y.encodeStateAsUpdate(this.doc);

        await this.config.save(content);

        this.emit("save", this.version);
    }

    private async onConnect() {
        this.logger("connected");

        const data = await this.config.load();

        this.logger("retrieved data", data ? "found" : "not found");

        if (data) {
            this.logger("applying update to yjs");
            try {
                this.applyUpdate(data);
            } catch (error) {
                this.logger(error);
            }
        }

        this.logger("setting connected flag to true");
        this.isOnline(true);

        this.emit("status", [{ status: "connected" }]);

        if (this.awareness.getLocalState() !== null) {
            const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(
                this.awareness,
                [this.doc.clientID],
            );
            this.emit("awareness", awarenessUpdate);
        }
    }

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    private applyUpdate(update: Uint8Array, origin?: any) {
        this.version++;
        Y.applyUpdate(this.doc, update, origin);
    }

    private disconnect() {
        if (this.channel) {
            this.supabase.removeChannel(this.channel);
            this.channel = null;
        }
    }

    private connect() {
        this.channel = this.supabase.channel(this.config.channel);
        if (this.channel) {
            this.channel
                .on(
                    REALTIME_LISTEN_TYPES.BROADCAST,
                    { event: "message" },
                    ({ payload }) => {
                        if (!payload || typeof payload !== "object") {
                            return;
                        }
                        const data = (payload as { data?: number[] }).data;
                        if (!Array.isArray(data)) return;
                        this.onMessage(Uint8Array.from(data), this);
                    },
                )
                .on(
                    REALTIME_LISTEN_TYPES.BROADCAST,
                    { event: "awareness" },
                    ({ payload }) => {
                        if (!payload || typeof payload !== "object") {
                            return;
                        }
                        const data = (payload as { data?: number[] }).data;
                        if (!Array.isArray(data)) return;
                        this.onAwareness(Uint8Array.from(data));
                    },
                )
                .subscribe((status, err) => {
                    if (status === "SUBSCRIBED") {
                        this.emit("connect", this);
                    }

                    if (status === "CHANNEL_ERROR") {
                        this.logger("CHANNEL_ERROR", err);
                        this.emit("error", this);
                    }

                    if (status === "TIMED_OUT") {
                        this.emit("disconnect", this);
                    }

                    if (status === "CLOSED") {
                        this.emit("disconnect", this);
                    }
                });
        }
    }

    constructor(
        private doc: Y.Doc,
        private supabase: SupabaseClient,
        private config: SupabaseProviderConfig,
    ) {
        super();

        this.awareness = this.config.awareness ||
            new awarenessProtocol.Awareness(doc);

        this.config = config || {};
        this.id = doc.clientID;

        this.supabase = supabase;
        this.on("connect", this.onConnect);
        this.on("disconnect", this.onDisconnect);

        this.logger = debug(`y-${doc.clientID}`);
        // turn on debug logging to the console
        this.logger.enabled = true;

        this.logger("constructor initializing");
        this.logger("connecting to Supabase Realtime", doc.guid);

        if (
            this.config.resyncInterval ||
            typeof this.config.resyncInterval === "undefined"
        ) {
            if (
                this.config.resyncInterval && this.config.resyncInterval < 3000
            ) {
                throw new Error("resync interval of less than 3 seconds");
            }
            this.logger(
                `setting resync interval to every ${
                    (this.config.resyncInterval || 5000) / 1000
                } seconds`,
            );
            this.resyncInterval = setInterval(() => {
                this.logger("resyncing (resync interval elapsed)");
                this.emit("message", Y.encodeStateAsUpdate(this.doc));
                if (this.channel) {
                    this.channel.send({
                        type: "broadcast",
                        event: "message",
                        payload: Array.from(Y.encodeStateAsUpdate(this.doc)),
                    });
                }
            }, this.config.resyncInterval || 5000);
        }

        if (typeof window !== "undefined") {
            window.addEventListener(
                "beforeunload",
                this.removeSelfFromAwarenessOnUnload,
            );
        } else if (typeof process !== "undefined") {
            process.on("exit", () => this.removeSelfFromAwarenessOnUnload);
        }
        this.on("awareness", (update) => {
            if (this.channel) {
                this.channel.send({
                    type: "broadcast",
                    event: "awareness",
                    payload: { data: Array.from(update) },
                });
            }
        });
        this.on("message", (update) => {
            if (this.channel) {
                this.channel.send({
                    type: "broadcast",
                    event: "message",
                    payload: { data: Array.from(update) },
                });
            }
        });

        this.connect();
        this.doc.on("update", this.onDocumentUpdate.bind(this));
        this.awareness.on("update", this.onAwarenessUpdate.bind(this));
    }

    get synced() {
        return this._synced;
    }

    set synced(state) {
        if (this._synced !== state) {
            this.logger(`setting sync state to ${state}`);
            this._synced = state;
            this.emit("synced", [state]);
            this.emit("sync", [state]);
        }
    }

    public onConnecting() {
        if (!this.isOnline()) {
            this.logger("connecting");
            this.emit("status", [{ status: "connecting" }]);
        }
    }

    public onDisconnect() {
        this.logger("disconnected");

        this.synced = false;
        this.isOnline(false);
        this.logger("set connected flag to false");
        if (this.isOnline()) {
            this.emit("status", [{ status: "disconnected" }]);
        }

        // update awareness (keep all users except local)
        // FIXME? compare to broadcast channel behavior
        const states = Array.from(this.awareness.getStates().keys()).filter((
            client,
        ) => client !== this.doc.clientID);
        awarenessProtocol.removeAwarenessStates(this.awareness, states, this);
    }

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    public onMessage(message: Uint8Array, _origin: any) {
        if (!this.isOnline()) return;
        try {
            this.applyUpdate(message, this);
        } catch (err) {
            this.logger(err);
        }
    }

    public onAwareness(message: Uint8Array) {
        awarenessProtocol.applyAwarenessUpdate(this.awareness, message, this);
    }

    public onAuth(message: Uint8Array) {
        this.logger(
            `received ${message.byteLength} bytes from peer: ${message}`,
        );

        if (!message) {
            this.logger("Permission denied to channel");
        }
        this.logger("processed message (type = MessageAuth)");
    }

    public destroy() {
        this.logger("destroying");

        if (this.resyncInterval) {
            clearInterval(this.resyncInterval);
        }

        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
        }

        if (this.awarenessTimer) {
            clearTimeout(this.awarenessTimer);
        }

        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }

        if (typeof window !== "undefined") {
            window.removeEventListener(
                "beforeunload",
                this.removeSelfFromAwarenessOnUnload,
            );
        } else if (typeof process !== "undefined") {
            process.off("exit", () => this.removeSelfFromAwarenessOnUnload);
        }

        this.awareness.off("update", this.onAwarenessUpdate);
        this.doc.off("update", this.onDocumentUpdate);

        if (this.channel) this.disconnect();
    }

    private scheduleSave() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }

        const delay = this.config.saveDebounceMs ?? 1000;

        this.saveTimer = setTimeout(() => {
            this.save().catch((err) => {
                this.logger("error during debounced save", err);
            });
        }, delay);
    }
}
