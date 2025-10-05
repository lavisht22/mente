import type { ModelMessage } from "ai";
import type { Tables } from "db.types";

export type ChatT = Tables<"chats">;
export type MessageT = Tables<"messages"> & { data: ModelMessage };
