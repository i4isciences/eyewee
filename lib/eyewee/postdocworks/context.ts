import "server-only";

import { getLinkedPostdocworksUserId } from "@/lib/postdocworksLink/link";
import { getPostdocworksProfile } from "@/lib/eyewee/postdocworks/profile";
import { getPapersByOrcid } from "@/lib/eyewee/postdocworks/papers";

// Folds a connected postdoc's real PostdocWorks profile + live PubMed papers into a short text
// block for the Claude system prompt (systemPrompt.ts). Returns null for anyone who hasn't
// connected -- the vast majority of eyewee's account-free users -- so this never adds a call for
// the common case.
export async function buildPostdocworksContext(deviceId: string): Promise<string | null> {
  const linkedUserId = await getLinkedPostdocworksUserId(deviceId).catch(() => null);
  if (!linkedUserId) return null;

  const profile = await getPostdocworksProfile(linkedUserId).catch(() => null);
  if (!profile) return null;

  const lines = [
    `Name: ${profile.displayName || "(not set)"}`,
    `Research area: ${profile.researchArea || "(not set)"}`,
    `Institution: ${profile.institution || "(not set)"}`,
  ];
  if (profile.verifiedBadges.length > 0) lines.push(`Verified badges: ${profile.verifiedBadges.join(", ")}`);
  if (profile.achievements.length > 0) lines.push(`Achievements: ${profile.achievements.map((a) => a.title).join("; ")}`);

  if (profile.orcid && profile.orcidVerified) {
    const papers = await getPapersByOrcid(profile.orcid, 10).catch(() => []);
    if (papers.length > 0) {
      lines.push(`Recent publications (via ORCID ${profile.orcid}):`);
      papers.slice(0, 10).forEach((p) => lines.push(`- "${p.title}" (${p.pubdate})`));
    }
  }

  return lines.join("\n");
}
