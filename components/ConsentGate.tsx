"use client";

import { useEffect, useState, type ReactNode } from "react";

// Gates every AI-facing surface (chat, Leverage, Document Search) behind an explicit one-time
// agreement, per the pre-launch checklist (2026-10-18, item 4): "Before the first chat, show a
// tick box... The Start button stays locked until it is ticked." Consent is recorded server-side
// (app/api/consent/route.ts) and re-checked there on every chat send -- this component is the UX
// for that gate, not the enforcement of it.
export function ConsentGate({ children }: { children: ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [agreed, setAgreed] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/consent")
      .then((res) => res.json())
      .then((data: { consented?: boolean }) => setAgreed(Boolean(data.consented)))
      .catch(() => setAgreed(false));
  }, []);

  async function handleStart() {
    if (!checked || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/consent", { method: "POST" });
      setAgreed(true);
    } catch {
      setSubmitting(false);
    }
  }

  if (agreed === null) return null;
  if (agreed) return <>{children}</>;

  return (
    <div className="consent-gate">
      <div className="consent-gate-card">
        <p className="consent-gate-kicker">BEFORE YOU START</p>
        <h1>Welcome to eyewee</h1>
        <p className="consent-gate-sub">eyewee is an AI. It can make mistakes. Check anything important.</p>
        <label className="consent-gate-checkbox">
          <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
          <span>
            I agree to the{" "}
            <a href="/terms" target="_blank" rel="noreferrer">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" target="_blank" rel="noreferrer">
              Privacy Policy
            </a>
            .
          </span>
        </label>
        <button type="button" disabled={!checked || submitting} onClick={handleStart}>
          Start
        </button>
      </div>
    </div>
  );
}
