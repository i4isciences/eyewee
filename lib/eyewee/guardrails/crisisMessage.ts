// The one approved crisis-response line (pending final counsel/clinician sign-off -- see the
// "INTERNAL-TESTING PLACEHOLDER" note in systemPrompt.ts, which applies here too). Used in two
// places: the fixed line always shown under the chat composer (PersonaExperience.tsx), and the
// message eyewee sends immediately -- without waiting on or relying on a live model call -- the
// moment containsCrisisLanguage() below fires on the user's own message. Keeping this as one
// exported constant means the UI's permanent disclaimer and the triggered reply can never drift
// apart.
export const CRISIS_LINE =
  "eyewee is not for emergencies or a mental health crisis. In an emergency, call 911 or your local emergency number. Call or text 988 (US), 9-8-8 (Canada), or Tele-MANAS 14416 (India) — 988 takes any text, you don't need to text a specific word.";

// Deliberately broad/conservative: a false positive (an unrelated message getting the crisis
// reply) costs a moment of confusion. A false negative is the one failure mode this exists to
// prevent -- this is why it's pattern-matching on the user's own message rather than trusting the
// model's judgment on whether to bring it up at all ("it relies on the AI alone" was the exact
// gap flagged in review).
const CRISIS_PATTERNS: RegExp[] = [
  /\bsuicid\w*/i,
  /\bself[- ]?harm\w*/i,
  /\bkill(?:ing)?\s+myself\b/i,
  /\b(?:want(?:ed)?|going|plan(?:ning)?)\s+to\s+die\b/i,
  /\bend(?:ing)?\s+(?:my\s+life|it\s+all)\b/i,
  /\bno\s+(?:reason|point)\s+(?:to|in)\s+(?:liv(?:e|ing)|go(?:ing)?\s+on)\b/i,
  /\bhurt(?:ing)?\s+myself\b/i,
  /\bcan'?t\s+(?:go\s+on|take\s+(?:it|this)\s+anymore|do\s+this\s+anymore)\b/i,
];

export function containsCrisisLanguage(text: string): boolean {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(text));
}
