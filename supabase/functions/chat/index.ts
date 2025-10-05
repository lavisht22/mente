import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  jsonSchema,
  stepCountIs,
  streamText,
  tool,
} from "https://esm.sh/ai@5.0.60";
import { createOpenAI } from "https://esm.sh/@ai-sdk/openai@2.0.42";

const openai = createOpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY")!,
});

Deno.serve(async (req) => {
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
    prompt: "What is the weather in San Francisco?",
    stopWhen: stepCountIs(10),
  });

  const parts = [];

  for await (const part of result.fullStream) {
    parts.push(part);
  }

  return new Response(
    JSON.stringify({ parts }),
    { headers: { "Content-Type": "application/json" } },
  );
});
