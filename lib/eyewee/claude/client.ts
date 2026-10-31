import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { fetchAbstract, searchPubMedWithDetails } from "@/lib/eyewee/documents/pubmedSearch";

const DEFAULT_MODEL = "claude-sonnet-5-5";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");
  client = new Anthropic({ apiKey });
  return client;
}

export type ChatTurn = {
  role: "user" | "assistant";
  content: string | Anthropic.MessageParam["content"];
};

const PUBMED_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_pubmed",
    description:
      "Search the official NCBI PubMed database for scientific literature, clinical trials, reviews, landmark papers, and biomedical research on any topic. Returns verified articles with PMID, title, authors, journal citation, publication date, DOI, URL, and abstracts.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "PubMed search query keywords or MeSH terms (e.g. 'triple negative breast cancer', 'pembrolizumab KEYNOTE-522', 'cccDNA hepatitis B')",
        },
        limit: {
          type: "number",
          description: "Number of papers to retrieve (default 5, max 10)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "fetch_pubmed_abstract",
    description: "Fetch the complete abstract and publication details for a specific PubMed article by its PMID.",
    input_schema: {
      type: "object",
      properties: {
        pmid: {
          type: "string",
          description: "The PubMed unique identifier (PMID), e.g. '30345906'",
        },
      },
      required: ["pmid"],
    },
  },
];

export async function generateEyeweeReply(
  system: string,
  history: ChatTurn[],
  enableTools = true
): Promise<string> {
  const anthropic = getClient();
  const model = process.env.EYEWEE_CLAUDE_MODEL || DEFAULT_MODEL;

  const messages: Anthropic.MessageParam[] = history.map((turn) => ({
    role: turn.role,
    content: turn.content,
  }));

  const maxToolIterations = 4;
  let iterations = 0;

  while (iterations < maxToolIterations) {
    iterations++;

    const response = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      system,
      messages,
      tools: enableTools ? PUBMED_TOOLS : undefined,
    });

    // If model wants to call tools (e.g. search_pubmed)
    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );

      // Add assistant's message with tool call blocks
      messages.push({
        role: "assistant",
        content: response.content,
      });

      // Execute each tool call
      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (block) => {
          try {
            if (block.name === "search_pubmed") {
              const input = block.input as { query: string; limit?: number };
              const limit = Math.min(Math.max(input.limit || 5, 1), 10);
              const result = await searchPubMedWithDetails(input.query, limit);
              return {
                type: "tool_result",
                tool_use_id: block.id,
                content: JSON.stringify(result),
              };
            }

            if (block.name === "fetch_pubmed_abstract") {
              const input = block.input as { pmid: string };
              const result = await fetchAbstract(input.pmid);
              return {
                type: "tool_result",
                tool_use_id: block.id,
                content: JSON.stringify(result),
              };
            }

            return {
              type: "tool_result",
              tool_use_id: block.id,
              is_error: true,
              content: `Unknown tool: ${block.name}`,
            };
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            return {
              type: "tool_result",
              tool_use_id: block.id,
              is_error: true,
              content: `Tool execution failed: ${message}`,
            };
          }
        })
      );

      // Return tool results as user message turn
      messages.push({
        role: "user",
        content: toolResults,
      });

      continue;
    }

    // Finished without tool use (or after tool use)
    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    const combinedText = textBlocks.map((b) => b.text).join("\n\n").trim();
    if (!combinedText) throw new Error("Claude returned no text content.");

    return combinedText;
  }

  throw new Error("Exceeded maximum tool iterations for PubMed query.");
}
