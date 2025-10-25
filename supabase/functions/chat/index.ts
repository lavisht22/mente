import "@supabase/functions-js/edge-runtime.d.ts";

import {
  type FilePart,
  type ImagePart,
  jsonSchema,
  ModelMessage,
  stepCountIs,
  streamText,
  type TextPart,
  tool,
} from "ai";
import { createAzure } from "@ai-sdk/azure";
import { createVertex } from "@ai-sdk/google-vertex/edge";
import { createClient } from "@supabase/supabase-js";
import { Database, Json } from "db.types";

const azure = createAzure({
  resourceName: Deno.env.get("AZURE_RESOURCE_NAME")!,
  apiKey: Deno.env.get("AZURE_API_KEY")!,
});

const vertex = createVertex({
  project: "tribe-5",
  location: "global",
  googleCredentials: {
    clientEmail: Deno.env.get("GOOGLE_CLIENT_EMAIL")!,
    privateKey: Deno.env.get("GOOGLE_PRIVATE_KEY")!.replace(/\\n/g, "\n"),
    privateKeyId: Deno.env.get("GOOGLE_PRIVATE_KEY_ID")!,
  },
});

function getAIChatModel(model: string) {
  switch (model) {
    case "gpt-5":
      return azure("gpt-5");
    case "gpt-5-chat":
      return azure("gpt-5-chat");
    case "gemini-2.5-pro":
      return vertex("gemini-2.5-pro");
    case "gemini-2.5-flash":
      return vertex("gemini-2.5-flash");
    default:
      throw new Error(`Unknown model: ${model}`);
  }
}

const encoder = new TextEncoder();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", {
      headers: {
        ...corsHeaders,
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Not Allowed", {
      status: 405,
      headers: {
        ...corsHeaders,
      },
    });
  }

  const { chat_id }: { chat_id?: string } = await req.json();

  if (!chat_id) {
    return new Response(JSON.stringify({ error: "No chat id provided" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
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
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }

  const messages = data.messages.reverse().map((m) => m.data as ModelMessage);

  // Transform messages to convert Supabase storage paths to signed URLs
  const transformedMessages = await Promise.all(
    messages.map(async (message) => {
      // Only process user messages with array content
      if (
        message.role === "user" &&
        Array.isArray(message.content)
      ) {
        const transformedContent = await Promise.all(
          message.content.map(async (part: TextPart | ImagePart | FilePart) => {
            if (part.type === "image") {
              const { data, error } = await supabase.storage
                .from("chats")
                .createSignedUrl(part.image, 3600);

              if (error) {
                throw error;
              }

              return {
                ...part,
                image: data.signedUrl,
              };
            }

            if (part.type === "file") {
              const { data, error } = await supabase.storage
                .from("chats")
                .createSignedUrl(part.data, 3600);

              if (error) {
                throw error;
              }

              return {
                ...part,
                data: data.signedUrl,
              };
            }

            return part;
          }),
        );

        return {
          ...message,
          content: transformedContent,
        };
      }

      return message;
    }),
  );

  console.log(
    "Transformed Messages:",
    JSON.stringify(transformedMessages, null, 2),
  );

  const body = new ReadableStream({
    async start(controller) {
      const result = await streamText({
        model: getAIChatModel(data.model),
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
            execute: ({ location }: { location: string }) => ({
              location,
              temperature: 72 + Math.floor(Math.random() * 21) - 10,
            }),
          }),
        },
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. Always output in markdown.",
          },
          ...transformedMessages,
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

      // Generate chat name if it doesn't exist
      if (!data.name) {
        const allMessages = [
          ...messages,
          ...lastStep.response.messages,
        ] as ModelMessage[];

        // Get the last 4 messages
        const lastFewMessages = allMessages.slice(-4);

        if (lastFewMessages.length > 0) {
          const { generateText } = await import("ai");

          const nameResult = await generateText({
            model: azure("gpt-5-chat"),
            prompt:
              `You are a helpful assistant that generates concise chat titles. Generate a short, descriptive title (max 6 words) for the conversation based on the following messages. Only output the title, nothing else.\n\nMessages:\n${
                lastFewMessages.map((m) =>
                  `${m.role}: ${JSON.stringify(m.content)}`
                ).join("\n")
              }`,
          });

          const generatedName = nameResult.text.trim();

          // Send the generated name through the stream
          controller.enqueue(
            encoder.encode(
              `data: ${
                JSON.stringify({ type: "chat-name", name: generatedName })
              }\r\n\r\n`,
            ),
          );

          // Store the generated name in the database
          await supabase
            .from("chats")
            .update({ name: generatedName })
            .eq("id", chat_id);
        }
      }

      controller.close();
    },
    cancel() {
      // TODO: Implement cancel here properly
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      ...corsHeaders,
    },
  });
});
