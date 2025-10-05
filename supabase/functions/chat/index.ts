import "@supabase/functions-js/edge-runtime.d.ts";

import { jsonSchema, ModelMessage, stepCountIs, streamText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createClient } from "@supabase/supabase-js";
import { Database, Json } from "db.types";

const openai = createOpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY")!,
});

const encoder = new TextEncoder();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", {
      headers: {
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Not Allowed", { status: 405 });
  }

  const { chat_id }: { chat_id?: string } = await req.json();

  if (!chat_id) {
    return new Response(JSON.stringify({ error: "No chat id provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient<Database>(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: {
          Authorization: req.headers.get("Authorization") || "",
        },
      },
    },
  );

  const { data, error } = await supabase
    .from("chats")
    .select("*, messages(*)")
    .eq("id", chat_id)
    .order("created_at", { ascending: false, referencedTable: "messages" })
    .limit(50, { referencedTable: "messages" })
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const messages = data.messages.reverse().map((m) => m.data as ModelMessage);

  const body = new ReadableStream({
    async start(controller) {
      const result = await streamText({
        model: openai("gpt-4.1"),
        tools: {
          weather: tool({
            description: "Get the weather in a location",
            inputSchema: jsonSchema({
              type: "object",
              properties: {
                location: {
                  type: "string",
                  description: "The location to get the weather for",
                },
              },
              required: ["location"],
            }),
            execute: async ({ location }) => ({
              location,
              temperature: 72 + Math.floor(Math.random() * 21) - 10,
            }),
          }),
        },
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant.",
          },
          ...messages,
        ],
        stopWhen: stepCountIs(10),
      });

      for await (const part of result.fullStream) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(part)}\r\n\r\n`),
        );
      }

      const steps = await result.steps;
      const lastStep = steps[steps.length - 1];

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(steps)}\r\n\r\n`),
      );

      for (const message of lastStep.response.messages) {
        await supabase.from("messages").insert({
          chat_id,
          data: message as Json,
        });
      }
    },
    cancel() {
      // TODO: Implement cancel here properly
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
    },
  });
});
