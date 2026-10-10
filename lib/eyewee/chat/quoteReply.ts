// Reply-to-a-specific-message support in PersonaExperience.tsx. There's no separate "replyToId"
// column -- a reply is still just a plain message, with the quoted snippet packed into its own
// text using a private delimiter that real chat text won't collide with. Both the quote and the
// new reply go to the backend together as one message, same as every other send.
const DELIMITER = ">>>";

export function formatQuotedReply(originalText: string, replyText: string): string {
  const snippet = originalText.replace(/\s+/g, " ").trim();
  const truncated = snippet.length > 160 ? `${snippet.slice(0, 160)}…` : snippet;
  return `${DELIMITER}${truncated}${DELIMITER}\n${replyText}`;
}

export function splitQuotedReply(text: string): { quote: string | null; body: string } {
  if (!text.startsWith(DELIMITER)) return { quote: null, body: text };
  const closeIndex = text.indexOf(DELIMITER, DELIMITER.length);
  if (closeIndex === -1) return { quote: null, body: text };
  const quote = text.slice(DELIMITER.length, closeIndex);
  const body = text.slice(closeIndex + DELIMITER.length).replace(/^\n/, "");
  return { quote, body };
}
