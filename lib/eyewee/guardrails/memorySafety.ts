// Locked rule (Ranjit, 2026-10-08): "Never offer to save anything about mental health, medical or
// immigration-case details, or other sensitive personal information. That rule is locked: no
// mental-health disclosures in profile, badge or matching data." This is a heuristic keyword/
// pattern filter, not an exhaustive classifier -- it exists so the rule is enforced in code, not
// just in a prompt an LLM might miss, same spirit as lib/eyewee/guardrails/phiFilter.ts.

const SENSITIVE_PATTERNS: RegExp[] = [
  // Mental health / crisis
  /\b(depress\w*|anxiety|anxious|suicid\w*|self[- ]harm|crisis|therap\w*|counsel(?:ing|or)|mental health|psychiatr\w*|medication for (?:depression|anxiety|bipolar|adhd)|diagnos\w*)\b/i,
  // Medical / health conditions
  /\b(diagnosed with|medical condition|chronic illness|disability|pregnan\w*|hiv|cancer|surgery|hospitali[sz]ed)\b/i,
  // Immigration case specifics (general visa process questions are fine -- this targets *case*-level detail)
  /\b(my (?:visa|immigration|asylum|green card) (?:case|application|status) (?:was|is|got)|deportation|ice (?:detained|detention)|undocumented)\b/i,
  // Other sensitive personal info
  /\b(ssn|social security number|salary is|credit card|bank account|password is)\b/i,
];

export function isSafeToRemember(text: string): boolean {
  return !SENSITIVE_PATTERNS.some((pattern) => pattern.test(text));
}
