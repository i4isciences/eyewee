"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function SignInForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signin", email, password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error || "Couldn't sign you in. Check your email and password.");
        setSubmitting(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
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
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Your password"
          autoComplete="current-password"
        />
      </label>
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" className="btn btn-navy auth-submit" disabled={submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
