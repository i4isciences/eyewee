import "server-only";

// Speech-to-text -- docs/DEVELOPMENT_PLAN.md §6.3 (Phase 5). Deepgram is the default adapter here
// (simple REST API, good multilingual + language-detection support) but this is a swappable
// default, not a final vendor decision -- the plan still calls for testing per-language word-error
// rate on accented speech across Google/Azure/Deepgram/Whisper before locking one in. Swapping
// providers means rewriting this one file, not any call site.
export class SttNotConfiguredError extends Error {
  constructor() {
    super("Speech-to-text isn't configured yet — set DEEPGRAM_API_KEY.");
    this.name = "SttNotConfiguredError";
  }
}

export type TranscriptionResult = { text: string; detectedLanguage: string | null };

export async function transcribeAudio(audio: Buffer, mimeType: string): Promise<TranscriptionResult> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) throw new SttNotConfiguredError();

  const url = "https://api.deepgram.com/v1/listen?detect_language=true&smart_format=true&punctuate=true";
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Token ${apiKey}`, "Content-Type": mimeType },
    body: new Uint8Array(audio),
  });

  if (!response.ok) throw new Error(`Deepgram request failed (${response.status}).`);
  const data = await response.json();

  const channel = data?.results?.channels?.[0];
  const transcript: string = channel?.alternatives?.[0]?.transcript ?? "";
  const detectedLanguage: string | null = channel?.detected_language ?? null;

  return { text: transcript, detectedLanguage };
}
