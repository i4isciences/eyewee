import { NextResponse } from "next/server";
import { createWaitlistClient } from "@/lib/waitlist/supabase";

const CAREER_STAGES = ["Postdoc", "PhD student", "Medical resident / fellow", "Faculty / PI", "Other"];

export async function POST(request: Request) {
  const body = (await request.json()) as {
    fullName?: unknown;
    email?: unknown;
    careerStage?: unknown;
    researchField?: unknown;
    institution?: unknown;
    city?: unknown;
    consentGiven?: unknown;
    consentedAt?: unknown;
  };

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const careerStage = typeof body.careerStage === "string" && CAREER_STAGES.includes(body.careerStage) ? body.careerStage : "Postdoc";
  const researchField = typeof body.researchField === "string" ? body.researchField.trim() : "";
  const institution = typeof body.institution === "string" ? body.institution.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const consentGiven = body.consentGiven === true;

  if (fullName.length < 2 || !email.includes("@")) {
    return NextResponse.json({ error: "Please add your name and email so we know where to send your invite." }, { status: 400 });
  }
  if (!consentGiven) {
    return NextResponse.json({ error: "Please accept the Terms of Service and Privacy Policy to continue." }, { status: 400 });
  }

  const supabase = createWaitlistClient();
  const { error } = await supabase.from("eyewee_waitlist").insert({
    full_name: fullName,
    email,
    career_stage: careerStage,
    research_field: researchField,
    institution,
    city,
    consent_given: consentGiven,
    consented_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: "Something went wrong on our end — please try again in a moment." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
