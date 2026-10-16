import "server-only";

import { getLinkedPostdocworksUserId } from "@/lib/postdocworksLink/link";
import { getPostdocworksProfile } from "@/lib/eyewee/postdocworks/profile";
import { getPapersByOrcid } from "@/lib/eyewee/postdocworks/papers";

// Only the LIVE part -- a connected postdoc's actual papers, fetched fresh from PubMed by ORCID
// every time. Everything else about their profile (name, field, institution, badges...) is
// already in Memory as real facts (lib/eyewee/postdocworks/syncMemory.ts, synced on connect), and
// listMemoryFacts() already feeds those into the system prompt alongside this -- duplicating them
// here would just burn tokens saying the same thing twice. Papers deliberately aren't stored as
// memory facts (they can be numerous and the list can grow), so this is the one piece that still
// needs a live per-request fetch.
export async function buildPostdocworksContext(deviceId: string): Promise<string | null> {
  const linkedUserId = await getLinkedPostdocworksUserId(deviceId).catch(() => null);
  if (!linkedUserId) return null;

  const profile = await getPostdocworksProfile(linkedUserId).catch(() => null);
  if (!profile?.orcid || !profile.orcidVerified) return null;

  const papers = await getPapersByOrcid(profile.orcid, 10).catch(() => []);
  if (papers.length === 0) return null;

  return [`Recent publications (via ORCID ${profile.orcid}):`, ...papers.map((p) => `- "${p.title}" (${p.pubdate})`)].join("\n");
}
