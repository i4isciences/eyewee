import "server-only";

// Text-to-speech -- docs/DEVELOPMENT_PLAN.md §6.3 (Phase 5). ElevenLabs is the default adapter
// (simple REST API, natural multilingual voices, easy female/male voice selection to match the
// planned female-first/male-later rollout) -- swappable default, not a final vendor decision; the
// plan still calls for native-speaker sign-off per language before locking one in.
export class TtsNotConfiguredError extends Error {
  constructor() {
    super("Text-to-speech isn't configured yet — set ELEVENLABS_API_KEY.");
    this.name = "TtsNotConfiguredError";
  }
}

// "Rachel" -- one of ElevenLabs' standard premade voices, used only as a working default so audio
// comes back today; swap via ELEVENLABS_VOICE_ID once real voice selection (§6.3) is decided.
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

export async function synthesizeSpeech(text: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new TtsNotConfiguredError();

  const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
  });

  if (!response.ok) throw new Error(`ElevenLabs request failed (${response.status}).`);
  return Buffer.from(await response.arrayBuffer());
}
