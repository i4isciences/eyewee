"use client";

import { useState, type FormEvent } from "react";

const ACCENT = "#F4A725";
const CAREER_STAGES = ["Postdoc", "PhD student", "Medical resident / fellow", "Faculty / PI", "Other"];

const inputStyle: React.CSSProperties = {
  fontFamily: "'Work Sans', sans-serif",
  fontSize: "14.5px",
  padding: "11px 13px",
  border: "1px solid #D8DCE6",
  borderRadius: "9px",
  boxSizing: "border-box",
  width: "100%",
};
const labelStyle: React.CSSProperties = { fontSize: "13px", fontWeight: 600, color: "#182D5A" };
const fieldStyle: React.CSSProperties = { flex: "1 1 220px", display: "flex", flexDirection: "column", gap: "6px" };

export function WaitlistForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [careerStage, setCareerStage] = useState("Postdoc");
  const [researchField, setResearchField] = useState("");
  const [institution, setInstitution] = useState("");
  const [city, setCity] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formErrorMsg, setFormErrorMsg] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!fullName.trim() || !email.trim()) {
      setFormErrorMsg("Please add your name and email so we know where to send your invite.");
      return;
    }
    if (!consentGiven) {
      setFormErrorMsg("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }
    setFormErrorMsg("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          careerStage,
          researchField,
          institution,
          city,
          consentGiven,
          consentedAt: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error("Request failed");
      setSubmitting(false);
      setSubmitted(true);
    } catch {
      setSubmitting(false);
      setFormErrorMsg("Something went wrong on our end — please try again in a moment.");
    }
  }

  if (submitted) {
    return (
      <div style={{ background: "#FFFFFF", border: "1px solid #E7E9F0", borderRadius: "20px", padding: "52px 44px", textAlign: "center" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "#EAF6EE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 22px",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2F9E52" strokeWidth={2.5}>
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "23px", color: "#182D5A", marginBottom: "12px" }}>
          You&rsquo;re on the list.
        </h2>
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "15px", lineHeight: 1.7, color: "#4B5468" }}>
          We&rsquo;ll email you the moment eyewee and Doc2Postdoc open in your field and metro. No spam — one email, when it&rsquo;s your turn.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "28px", color: "#182D5A", marginBottom: "12px" }}>
          Be first in your field.
        </h2>
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "15px", lineHeight: 1.7, color: "#4B5468", maxWidth: "480px", margin: "0 auto" }}>
          We&rsquo;re opening Doc2Postdoc metro by metro, field by field — Chicago and St. Louis first. Join now and you&rsquo;re matched the moment
          your field opens, ahead of general signups.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        style={{ background: "#FFFFFF", border: "1px solid #E7E9F0", borderRadius: "20px", padding: "36px", display: "flex", flexDirection: "column", gap: "18px" }}
      >
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <div style={fieldStyle}>
            <label htmlFor="pw-name" style={labelStyle}>
              Full name
            </label>
            <input id="pw-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <label htmlFor="pw-email" style={labelStyle}>
              Email
            </label>
            <input
              id="pw-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@university.edu"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="pw-stage" style={labelStyle}>
            Career stage
          </label>
          <select id="pw-stage" value={careerStage} onChange={(e) => setCareerStage(e.target.value)} style={{ ...inputStyle, background: "#FFFFFF" }}>
            {CAREER_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <div style={fieldStyle}>
            <label htmlFor="pw-field" style={labelStyle}>
              Research field
            </label>
            <input
              id="pw-field"
              type="text"
              value={researchField}
              onChange={(e) => setResearchField(e.target.value)}
              placeholder="e.g. HBV virology"
              style={inputStyle}
            />
          </div>
          <div style={fieldStyle}>
            <label htmlFor="pw-inst" style={labelStyle}>
              Institution
            </label>
            <input
              id="pw-inst"
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="University or lab"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="pw-city" style={labelStyle}>
            City / metro area
          </label>
          <input id="pw-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Chicago, IL" style={inputStyle} />
        </div>

        {formErrorMsg && <div style={{ fontSize: "13px", color: "#B3261E" }}>{formErrorMsg}</div>}

        <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            style={{ marginTop: "3px", width: "16px", height: "16px", flexShrink: 0, accentColor: ACCENT }}
          />
          <span style={{ fontSize: "12.5px", color: "#4B5468", lineHeight: 1.5 }}>
            I agree to the{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "#182D5A", fontWeight: 600, textDecoration: "underline" }}>
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#182D5A", fontWeight: 600, textDecoration: "underline" }}>
              Privacy Policy
            </a>
            .
          </span>
        </label>

        <button
          type="submit"
          style={{
            fontFamily: "'Work Sans', sans-serif",
            fontWeight: 700,
            fontSize: "15.5px",
            color: "#182D5A",
            background: ACCENT,
            border: "none",
            borderRadius: "9px",
            padding: "15px",
            cursor: "pointer",
            marginTop: "6px",
          }}
        >
          {submitting ? "Joining…" : "Join the waitlist"}
        </button>

        <p style={{ fontSize: "12px", color: "#8A93A6", textAlign: "center", margin: 0 }}>
          Early access only — no live matching or eyewee conversations yet. You&rsquo;ll be first to know when they open.
        </p>
      </form>
    </div>
  );
}
