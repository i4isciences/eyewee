import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { fetchAbstract, searchPubMedWithDetails } from "@/lib/eyewee/documents/pubmedSearch";
import { createDeckPair } from "@/lib/eyewee/decks/service";
import type { VerifiedReference } from "@/lib/eyewee/decks/writer";

const DEFAULT_MODEL = "claude-sonnet-5-5";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");
  client = new Anthropic({ apiKey });
  return client;
}

export function getAnthropicClient(): Anthropic {
  return getClient();
}

export function getEyeweeModel(): string {
  return process.env.EYEWEE_CLAUDE_MODEL || DEFAULT_MODEL;
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

const CREATE_DECK_TOOL: Anthropic.Tool = {
  name: "create_deck",
  description:
    "Create two real, downloadable PowerPoint (.pptx) files together: a Layman's Edition and a Technical Edition. Use this whenever the user asks for a presentation, slides or a deck. First make sure you know the topic, the audience and the number of slides (3 to 20); ask if any is missing. Pass the user's own material in source_material -- never invent data, results or citations. To cite papers, first find them with search_pubmed and pass their PMIDs in pmids.",
  input_schema: {
    type: "object",
    properties: {
      topic: { type: "string", description: "What the presentation is about." },
      audience: { type: "string", description: "Who will watch it, e.g. 'PI and lab group'." },
      length: { type: "number", description: "Number of content slides, 3 to 20." },
      source_material: { type: "string", description: "The postdoc's own text, notes or findings to build the slides from." },
      pmids: {
        type: "array",
        items: { type: "string" },
        description: "PMIDs returned by search_pubmed in this conversation turn that may be cited on slides.",
      },
    },
    required: ["topic", "audience", "length", "source_material"],
  },
};

export type ReplyContext = { deviceId?: string };

export async function generateEyeweeReply(
  system: string,
  history: ChatTurn[],
  enableTools = true,
  ctx: ReplyContext = {}
): Promise<string> {
  const anthropic = getClient();
  const model = getEyeweeModel();
  // Papers the literature tool returned this turn: the only ones a deck may cite.
  const seenReferences = new Map<string, VerifiedReference>();
  let deckLinksMarkdown = "";

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
      tools: enableTools ? (ctx.deviceId ? [...PUBMED_TOOLS, CREATE_DECK_TOOL] : PUBMED_TOOLS) : undefined,
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
              for (const paper of result.papers) {
                seenReferences.set(paper.pmid, { pmid: paper.pmid, citation: `${paper.authors} ${paper.title} ${paper.citation || paper.source}`.trim() });
              }
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

            if (block.name === "create_deck" && ctx.deviceId) {
              const input = block.input as { topic?: string; audience?: string; length?: number; source_material?: string; pmids?: string[] };
              const references = (input.pmids ?? []).flatMap((pmid) => {
                const ref = seenReferences.get(String(pmid));
                return ref ? [ref] : [];
              });
              const result = await createDeckPair({
                deviceId: ctx.deviceId,
                topic: String(input.topic ?? ""),
                audience: String(input.audience ?? ""),
                slideCount: Number(input.length),
                sourceMaterial: String(input.source_material ?? ""),
                references,
              });
              if (!result.ok) {
                return { type: "tool_result", tool_use_id: block.id, is_error: true, content: `Deck creation failed: ${result.error} Tell the user plainly and offer to try again.` };
              }
              const links = result.files.map((f) => `[${f.label}](${f.url})`).join("\n\n");
              deckLinksMarkdown = `**Your decks are ready.** ${result.stamp}.\n\n${links}\n\nThe download links work for about an hour, and the files are deleted after 24 hours.`;
              return {
                type: "tool_result",
                tool_use_id: block.id,
                content: "Both decks were built and stored. The download buttons are added to your reply automatically -- do NOT write any links or URLs. Briefly say what each edition is (Layman's: plain language; Technical: the postdoc's level, with a reversal line on every slide) in two sentences.",
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

    return deckLinksMarkdown ? `${combinedText}\n\n${deckLinksMarkdown}` : combinedText;
  }

  throw new Error("Exceeded maximum tool iterations for PubMed query.");
}
