import { NextResponse } from "next/server";

// Starts the opt-in link (docs/DEVELOPMENT_PLAN.md §10): sends the browser to postdocworks' own
// eyewee-link endpoint, which mints a signed token if (and only if) the postdoc is already logged
// into postdocworks there, and sends them back to our callback below.
export async function GET() {
  const postdocworksAppUrl = process.env.POSTDOCWORKS_APP_URL;
  if (!postdocworksAppUrl) {
    return NextResponse.json({ error: "postdocworks connection isn't configured yet — set POSTDOCWORKS_APP_URL." }, { status: 501 });
  }
  return NextResponse.redirect(new URL("/api/eyewee-link", postdocworksAppUrl));
}
