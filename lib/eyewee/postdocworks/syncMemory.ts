import "server-only";

import type { PostdocworksProfile } from "@/lib/eyewee/postdocworks/profile";
import { replaceSourcedMemoryFacts } from "@/lib/eyewee/memory";
import type { MemoryCategory } from "@/lib/eyewee/memory";

export const POSTDOCWORKS_MEMORY_SOURCE = "postdocworks";

const ROLE_LABEL: Record<string, string> = {
  phd_student: "PhD student",
  postdoc: "Postdoc",
  faculty: "Faculty",
  industry: "Industry",
};

// Turns a connected profile into a clean, categorized set of memory facts -- one short fact per
// idea, not one giant paragraph, so the Memory sidebar stays readable and each fact is still
// individually editable/deletable. Every fact is scoped to a known MemoryCategory
// (field/focus/badge/preference/other) the same way conversation-suggested facts are.
export function buildMemoryFactsFromProfile(profile: PostdocworksProfile): { text: string; category: MemoryCategory }[] {
  const facts: { text: string; category: MemoryCategory }[] = [];

  const roleLabel = ROLE_LABEL[profile.role] ?? profile.role;
  if (profile.displayName) facts.push({ text: `Name: ${profile.displayName}${roleLabel ? ` (${roleLabel})` : ""}`, category: "other" });
  if (profile.careerStage) facts.push({ text: `Career stage: ${profile.careerStage}`, category: "other" });

  const fieldParts = [profile.pillar, profile.pillarField].filter(Boolean).join(" > ");
  if (fieldParts) facts.push({ text: `Research field: ${fieldParts}`, category: "field" });
  if (profile.specialization) facts.push({ text: `Specific focus: ${profile.specialization}`, category: "focus" });
  if (profile.secondaryPillar) facts.push({ text: `Secondary field: ${profile.secondaryPillar}`, category: "field" });

  const institutionParts = [profile.institution, profile.department].filter(Boolean).join(", ");
  if (institutionParts) facts.push({ text: `Institution: ${institutionParts}`, category: "other" });
  if (profile.geography) facts.push({ text: `Located in: ${profile.geography}`, category: "other" });
  if (profile.languages) facts.push({ text: `Languages: ${profile.languages}`, category: "other" });
  if (profile.academicMemberships) facts.push({ text: `Academic memberships: ${profile.academicMemberships}`, category: "other" });
  if (profile.about) facts.push({ text: `About: ${profile.about}`, category: "other" });

  if (profile.verifiedBadges.length > 0) facts.push({ text: `Verified badges: ${profile.verifiedBadges.join(", ")}`, category: "badge" });
  if (profile.credibilityScore > 0) facts.push({ text: `Credibility score: ${profile.credibilityScore}/100`, category: "badge" });
  if (profile.orcid) facts.push({ text: `ORCID: ${profile.orcid}${profile.orcidVerified ? " (verified)" : " (unverified)"}`, category: "badge" });

  profile.achievements.forEach((a) => facts.push({ text: `Achievement: ${a.title}${a.organization ? ` — ${a.organization}` : ""}`, category: "badge" }));
  profile.certifications.forEach((c) => facts.push({ text: `Certification: ${c.name}${c.issuingOrganization ? ` — ${c.issuingOrganization}` : ""}`, category: "badge" }));
  profile.education.forEach((e) => facts.push({ text: `Education: ${e.degree}${e.field ? ` in ${e.field}` : ""}${e.institution ? ` — ${e.institution}` : ""}`, category: "other" }));
  profile.experience
    .filter((e) => e.isCurrent)
    .forEach((e) => facts.push({ text: `Current role: ${e.roleTitle}${e.company ? ` at ${e.company}` : ""}`, category: "other" }));

  if (profile.mentorAvailable) facts.push({ text: "Available to mentor a PhD student", category: "preference" });

  return facts;
}

export async function syncPostdocworksMemory(deviceId: string, profile: PostdocworksProfile): Promise<void> {
  const facts = buildMemoryFactsFromProfile(profile);
  await replaceSourcedMemoryFacts(deviceId, POSTDOCWORKS_MEMORY_SOURCE, facts);
}
