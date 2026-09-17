"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function SignUpForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setStatus("submitting");
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signup", email, password, displayName }),
      });
      const data = (await response.json()) as { error?: string; confirmationRequired?: boolean };
      if (!response.ok) {
        setError(data.error || "Something went wrong. Try again.");
        setStatus("idle");
        return;
      }
      if (data.confirmationRequired) {
        setStatus("sent");
      } else {
        router.push("/home");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Try again.");
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div className="auth-notice">
        <p>Check your email to confirm your account — we sent a link to {email}.</p>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-field">
        <span>Name</span>
        <input
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Dr. Jane Rao"
          autoComplete="name"
        />
      </label>
      <label className="auth-field">
        <span>Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@university.edu"
          autoComplete="email"
        />
      </label>
      <label className="auth-field">
        <span>Password</span>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
      </label>
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" className="btn btn-navy auth-submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
