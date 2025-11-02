import { tool } from "ai";
import { z } from "zod";

import { Exa } from "exa-js";

export const exa = new Exa(Deno.env.get("EXA_API_KEY")!);

export const webSearch = tool({
  description: "Search the internet for up-to-date information.",
  inputSchema: z.object({
    query: z.string().min(1).max(100),
    category: z.enum([
      "company",
      "research paper",
      "news",
      "pdf",
      "github",
      "tweet",
      "personal site",
      "linkedin profile",
      "financial report",
    ]).optional().describe("A data category to focus on."),
    numResults: z.number().int().positive().max(5).optional().default(
      3,
    )
      .describe(
        "Number of search results to return. Default value is 3, use a value larger than 3 when doing some deep research.",
      ),
  }),
  execute: async (
    { query, numResults = 3, category }: {
      query: string;
      numResults: number;
      category?:
        | "company"
        | "research paper"
        | "news"
        | "pdf"
        | "github"
        | "tweet"
        | "personal site"
        | "linkedin profile"
        | "financial report";
    },
  ) => {
    const { context } = await exa.search(query, {
      numResults,
      category,

      contents: {
        context: true,
        text: true,
      },
    });

    return context;
  },
});
