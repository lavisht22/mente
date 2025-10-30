import { queryOptions } from "@tanstack/react-query";

import supabase from "./supabase";

export const spacesQuery = queryOptions({
    queryKey: ["spaces"],
    queryFn: async () => {
        const { data, error } = await supabase
            .from("spaces")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        return data;
    },
});

export const spaceQuery = (id: string) =>
    queryOptions({
        queryKey: ["space", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("spaces")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;

            return data;
        },
        enabled: !!id,
    });

export const itemsQuery = queryOptions({
    queryKey: ["items"],
    queryFn: async () => {
        const { data, error } = await supabase
            .from("items")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        return data;
    },
});

export const spaceItemsQuery = (spaceId: string) =>
    queryOptions({
        queryKey: ["space_items", spaceId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("items")
                .select("*")
                .eq("space_id", spaceId)
                .order("created_at", { ascending: false });

            if (error) throw error;

            return data;
        },
        enabled: !!spaceId,
    });

export const itemQuery = (id: string) =>
    queryOptions({
        queryKey: ["item", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("items")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;

            return data;
        },
    });

export const spaceChatsQuery = (id?: string) =>
    queryOptions({
        queryKey: ["space_chats", id],
        queryFn: async () => {
            if (!id) {
                throw new Error("ID not provided");
            }

            const { data, error } = await supabase
                .from("chats")
                .select("*")
                .eq("space_id", id)
                .order("created_at", { ascending: false }).limit(100);

            if (error) throw error;

            return data;
        },
        enabled: !!id,
    });

export const chatQuery = (id: string) =>
    queryOptions({
        queryKey: ["chat", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("chats")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;

            return data;
        },
        enabled: !!id,
    });

export const chatMessagesQuery = (id: string) =>
    queryOptions({
        queryKey: ["chat_messages", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq("chat_id", id)
                .order("created_at", { ascending: true });

            if (error) throw error;

            return data;
        },
        enabled: !!id,
    });

export const signedURLQuery = (bucket: string, path: string) =>
    queryOptions({
        queryKey: ["signed_url", path],
        queryFn: async () => {
            const { data, error } = await supabase.storage
                .from(bucket)
                .createSignedUrl(path, 300); // URL valid for 300 seconds

            if (error) throw error;

            return data.signedUrl;
        },
        enabled: !!path,
    });

export const spaceUsersQuery = (spaceId: string) =>
    queryOptions({
        queryKey: ["space_users", spaceId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("space_user")
                .select("*, users(name)")
                .eq("space_id", spaceId);

            if (error) throw error;

            return data;
        },
        enabled: !!spaceId,
    });

export const usersQuery = queryOptions({
    queryKey: ["profiles"],
    queryFn: async () => {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .is("is_hidden", false)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return data;
    },
});

export const userQuery = queryOptions({
    queryKey: ["user"],
    queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .single();

        if (error) throw error;

        return data;
    },
});
