import "server-only";

import { createEyeweeServiceClient } from "@/lib/eyewee/supabaseAdmin";

// Read-only access to a postdoc's REAL postdocworks data, once they've opted in via
// lib/postdocworksLink. This works because eyewee and postdocworks share the exact same Supabase
// project -- eyewee's service-role client can read postdocworks' tables directly, no API call to
// that app needed. Never writes to any of these tables from eyewee.
export type PostdocworksProfile = {
  displayName: string;
  role: string;
  researchArea: string;
  institution: string;
  bio: string;
  verifiedBadges: string[];
  credibilityScore: number;
  orcid: string | null;
  orcidVerified: boolean;
  scholarUrl: string | null;
  researchgateUrl: string | null;
  achievements: { title: string; organization: string; achievedOn: string | null }[];
};

export async function getPostdocworksProfile(postdocworksUserId: string): Promise<PostdocworksProfile | null> {
  const supabase = createEyeweeServiceClient();

  const { data: profile, error: profileError } = await supabase
    .from("doc2postdoc_profiles")
    .select("display_name, role, research_area, institution, bio, verified_badges, credibility_score")
    .eq("id", postdocworksUserId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) return null;

  const { data: credential } = await supabase
    .from("credential_applications")
    .select("orcid, orcid_verified, scholar, researchgate")
    .eq("user_id", postdocworksUserId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: achievements } = await supabase
    .from("doc2postdoc_achievements")
    .select("title, organization, achieved_on")
    .eq("profile_id", postdocworksUserId)
    .order("achieved_on", { ascending: false });

  return {
    displayName: profile.display_name,
    role: profile.role,
    researchArea: profile.research_area,
    institution: profile.institution,
    bio: profile.bio,
    verifiedBadges: profile.verified_badges ?? [],
    credibilityScore: Number(profile.credibility_score ?? 0),
    orcid: credential?.orcid || null,
    orcidVerified: credential?.orcid_verified ?? false,
    scholarUrl: credential?.scholar || null,
    researchgateUrl: credential?.researchgate || null,
    achievements: (achievements ?? []).map((a) => ({ title: a.title, organization: a.organization, achievedOn: a.achieved_on })),
  };
}
