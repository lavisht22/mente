import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createClient } from "@supabase/supabase-js";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { VoyageAIClient } from "voyageai";
import { z } from "zod";

import type { Database } from "db.types";

const supabase = createClient<Database>(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SECRET_API_KEY as string,
);

const voyage = new VoyageAIClient({
  apiKey: process.env.VOYAGEAI_API_KEY as string,
});

const schema = z.object({
  item_id: z.string().uuid(),
});

export const genNoteEmbedding = schemaTask({
  id: "gen-note-embedding",
  maxDuration: 300,
  schema,
  run: async (payload) => {
    const { data, error } = await supabase.from("items").select("*").eq(
      "id",
      payload.item_id,
    ).single();

    if (error) {
      throw error;
    }

    if (data.type !== "note") {
      logger.info("Not a note, skipping embedding generation");
      return;
    }

    if (!data.is_embed_pending) {
      logger.info("Embedding not pending, skipping");
      return;
    }

    if (!data.markdown) {
      logger.info("No markdown found, skipping embedding generation");
      return;
    }

    // Delete existing chunks
    await supabase.from("chunks").delete().eq(
      "item_id",
      payload.item_id,
    ).throwOnError();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 10000,
      chunkOverlap: 2000,
    });

    const contentChunks = await splitter.splitText(data.markdown);

    const chunks = [];

    for (const content of contentChunks) {
      const embedResponse = await voyage.embed({
        input: content,
        model: "voyage-3-large",
      });

      if (!embedResponse.data || embedResponse.data.length === 0) {
        throw new Error("No embedding returned from VoyageAI");
      }

      const embedding = embedResponse.data[0].embedding;

      chunks.push({
        item_id: payload.item_id,
        content,
        embedding: JSON.stringify(embedding),
      });
    }

    // Insert new chunks
    await supabase.from("chunks").insert(
      chunks,
    ).throwOnError();

    logger.info(
      `Generated ${chunks.length} chunks for item ${payload.item_id}`,
    );
  },
});
