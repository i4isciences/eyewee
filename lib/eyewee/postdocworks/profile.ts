import "server-only";

import { createEyeweeServiceClient } from "@/lib/eyewee/supabaseAdmin";

// Read-only access to a postdoc's REAL postdocworks/Doc2Postdoc data, once they've opted in via
// lib/postdocworksLink. Works because eyewee and postdocworks share the exact same Supabase
// project -- eyewee's service-role client reads postdocworks' tables directly, no API call to
// that app needed. Never writes to any of these tables from eyewee.
//
// Field list below was built by reading the actual registration/profile form
// (postdocworks/app/doc2postdoc/Doc2PostdocProfileForm.tsx) and every migration that ever added a
// column to doc2postdoc_profiles -- not guessed. Two fields from that form are deliberately NOT
// pulled in here: `marital_status` and `dietary`. Everything else on the form is a professional/
// research-matching detail; those two read as "other sensitive personal information" under
// Ranjit's locked memory rule (2026-10-08) even though they aren't explicitly named in it -- so
// they're excluded on the same principle, not because the rule says their exact words.
export type PostdocworksProfile = {
  displayName: string;
  email: string;
  role: string; // phd_student | postdoc | faculty | industry
  careerStage: string;
  pillar: string;
  pillarField: string;
  specialization: string;
  secondaryPillar: string;
  about: string;
  institution: string;
  department: string;
  geography: string;
  languages: string;
  academicMemberships: string;
  socialMemberships: string;
  isMentor: boolean;
  mentorAvailable: boolean;
  verifiedBadges: string[];
  credibilityScore: number;
  orcid: string | null;
  orcidVerified: boolean;
  scholarUrl: string | null;
  researchgateUrl: string | null;
  linkedinUrl: string | null;
  achievements: { title: string; organization: string; achievedOn: string | null }[];
  education: { institution: string; degree: string; field: string }[];
  experience: { roleTitle: string; company: string; isCurrent: boolean }[];
  certifications: { name: string; issuingOrganization: string }[];
};

export async function getPostdocworksProfile(postdocworksUserId: string): Promise<PostdocworksProfile | null> {
  const supabase = createEyeweeServiceClient();

  const { data: profile, error: profileError } = await supabase
    .from("doc2postdoc_profiles")
    .select(
      "display_name, email, role, career_stage_label, career_stage, pillar, pillar_field, specialization, secondary_pillar, about, bio, institution, department, geography, languages, academic_memberships, social_memberships, is_mentor, mentor_available, verified_badges, credibility_score"
    )
    .eq("id", postdocworksUserId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) return null;

  const { data: credential } = await supabase
    .from("credential_applications")
    .select("orcid, orcid_verified, scholar, researchgate, linkedin")
    .eq("user_id", postdocworksUserId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const [{ data: achievements }, { data: education }, { data: experience }, { data: certifications }] = await Promise.all([
    supabase.from("doc2postdoc_achievements").select("title, organization, achieved_on").eq("profile_id", postdocworksUserId).order("achieved_on", { ascending: false }),
    supabase.from("doc2postdoc_education").select("institution, degree, field").eq("profile_id", postdocworksUserId).order("started_on", { ascending: false }),
    supabase.from("doc2postdoc_experience").select("role_title, company, is_current").eq("profile_id", postdocworksUserId).order("started_on", { ascending: false }),
    supabase.from("doc2postdoc_certifications").select("name, issuing_organization").eq("profile_id", postdocworksUserId).order("issued_on", { ascending: false }),
  ]);

  return {
    displayName: profile.display_name,
    email: profile.email,
    role: profile.role,
    careerStage: profile.career_stage_label || profile.career_stage,
    pillar: profile.pillar,
    pillarField: profile.pillar_field,
    specialization: profile.specialization,
    secondaryPillar: profile.secondary_pillar,
    about: profile.about || profile.bio,
    institution: profile.institution,
    department: profile.department,
    geography: profile.geography,
    languages: profile.languages,
    academicMemberships: profile.academic_memberships,
    socialMemberships: profile.social_memberships,
    isMentor: Boolean(profile.is_mentor),
    mentorAvailable: Boolean(profile.mentor_available),
    verifiedBadges: profile.verified_badges ?? [],
    credibilityScore: Number(profile.credibility_score ?? 0),
    orcid: credential?.orcid || null,
    orcidVerified: credential?.orcid_verified ?? false,
    scholarUrl: credential?.scholar || null,
    researchgateUrl: credential?.researchgate || null,
    linkedinUrl: credential?.linkedin || null,
    achievements: (achievements ?? []).map((a) => ({ title: a.title, organization: a.organization, achievedOn: a.achieved_on })),
    education: (education ?? []).map((e) => ({ institution: e.institution, degree: e.degree, field: e.field })),
    experience: (experience ?? []).map((e) => ({ roleTitle: e.role_title, company: e.company, isCurrent: e.is_current })),
    certifications: (certifications ?? []).map((c) => ({ name: c.name, issuingOrganization: c.issuing_organization })),
  };
}
