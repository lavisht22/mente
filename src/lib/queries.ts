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

export const chatsQuery = queryOptions({
    queryKey: ["chats"],
    queryFn: async () => {
        const { data, error } = await supabase
            .from("chats")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(10);

        if (error) throw error;

        return data;
    },
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
