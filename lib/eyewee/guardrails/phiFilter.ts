// Input-side PHI detection, per docs/DEVELOPMENT_PLAN.md §6.6: pattern-match MRN-style formats,
// SSNs, and name+DOB combinations before a message reaches the model. This is a heuristic
// pre-filter, not an exhaustive PHI classifier -- it exists to block or flag the obvious cases
// (never silently pass through), not to replace a real de-identification pipeline.

export type PhiMatch = {
  kind: "mrn" | "ssn" | "name-dob";
  snippet: string;
};

const MRN_PATTERN = /\b(?:mrn|medical record (?:number|no\.?)|patient id|chart (?:number|no\.?))\s*[:#]?\s*[a-z0-9-]{4,}/gi;

const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b|\bssn\s*[:#]?\s*\d{9}\b/gi;

// DOB-style date near an explicit "DOB"/"date of birth" label -- deliberately conservative
// (labeled dates only) to avoid flagging every date mentioned in a message.
const DOB_LABELED_DATE = /\b(?:dob|date of birth)\s*[:#]?\s*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/gi;

// A capitalized two-or-three-word run near a labeled DOB reads as a name+DOB combination -- the
// riskiest pairing per the PHI spec, since either alone is far less identifying.
const NAME_NEAR_DATE_WINDOW = 60;
const CAPITALIZED_NAME_PATTERN = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}\b/g;

export function findPhiMatches(text: string): PhiMatch[] {
  const matches: PhiMatch[] = [];

  for (const m of text.matchAll(MRN_PATTERN)) matches.push({ kind: "mrn", snippet: m[0] });
  for (const m of text.matchAll(SSN_PATTERN)) matches.push({ kind: "ssn", snippet: m[0] });

  for (const dobMatch of text.matchAll(DOB_LABELED_DATE)) {
    const start = Math.max(0, (dobMatch.index ?? 0) - NAME_NEAR_DATE_WINDOW);
    const end = Math.min(text.length, (dobMatch.index ?? 0) + dobMatch[0].length + NAME_NEAR_DATE_WINDOW);
    const window = text.slice(start, end);
    const nameMatch = window.match(CAPITALIZED_NAME_PATTERN);
    if (nameMatch) matches.push({ kind: "name-dob", snippet: `${nameMatch[0]} … ${dobMatch[0]}` });
  }

  return matches;
}

export function containsPhi(text: string): boolean {
  return findPhiMatches(text).length > 0;
}
