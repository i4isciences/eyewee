// Strips the handful of marks MarkdownLite renders (**bold**, "- "/"* " bullets, [text](url)
// links) before text-to-speech -- without this, ElevenLabs would read the literal asterisks and
// brackets aloud instead of the formatted text the chat bubble shows.
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[ \t]*[-*]\s+/gm, "");
}
