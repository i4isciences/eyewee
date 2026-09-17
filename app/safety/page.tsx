import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Safety & Responsible Use — eyewee",
  description: "What eyewee can and can't do, and how to use it responsibly.",
};

export default function SafetyPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Link href="/" className="landing-brand">
            <svg className="landing-brand-mark" viewBox="0 0 40 24" aria-hidden="true">
              <path
                d="M2 12C7 4 15 1 20 1s13 3 18 11c-5 8-13 11-18 11S7 20 2 12Z"
                fill="none"
                stroke="var(--gold)"
                strokeWidth="1.6"
              />
              <circle cx="20" cy="12" r="5.4" fill="var(--gold)" />
              <circle cx="20" cy="12" r="2.3" fill="#080c1a" />
            </svg>
            <span className="landing-wordmark">eyewee</span>
          </Link>
          <nav className="landing-nav-links">
            <Link href="/sign-in" className="landing-nav-link">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <section className="safety-hero">
        <p className="safety-kicker">AI Safety &amp; Responsible Use</p>
        <h1 className="safety-title">Please read this before you rely on eyewee.</h1>
        <p className="safety-lede">
          eyewee is an early-stage AI companion, built by i4iSciences&trade;. It&rsquo;s here to help you
          think, translate, and navigate — not to replace your own judgment, or the professionals in
          your life who are qualified to give you advice.
        </p>
      </section>

      <section className="safety-body">
        <article className="safety-block">
          <h2>eyewee can make mistakes</h2>
          <p>
            Like any AI system, eyewee can misunderstand what you meant, get facts wrong, or sound
            confident about something it&rsquo;s actually unsure of. Treat everything it tells you as a
            starting point, not a final answer — and check anything important against a primary
            source or a person qualified to confirm it.
          </p>
        </article>

        <article className="safety-block">
          <h2>Not a substitute for professional advice</h2>
          <p>
            eyewee is not a medical provider, therapist, lawyer, immigration counsel, or financial
            advisor, and nothing it says should be treated as medical, legal, immigration, tax, or
            financial advice. For decisions in any of those areas, please consult a licensed
            professional.
          </p>
        </article>

        <article className="safety-block safety-block-emphasis">
          <h2>If you&rsquo;re in crisis, please don&rsquo;t wait on eyewee</h2>
          <p>
            eyewee is not equipped to support a mental health crisis or emergency, and it is not
            monitored in real time. If you or someone else may be in danger, please contact your
            local emergency number, or, in the United States, call or text <strong>988</strong> (the
            Suicide &amp; Crisis Lifeline). If you&rsquo;re outside the US, please reach out to your
            country&rsquo;s local emergency or crisis service.
          </p>
        </article>

        <article className="safety-block">
          <h2>How your data is used</h2>
          <p>
            Conversations and account information are stored to make eyewee work — so it can show you
            your own history, and so we can improve the product. We don&rsquo;t sell your data. A full
            privacy policy is on its way as eyewee moves out of early access.
          </p>
        </article>

        <article className="safety-block">
          <h2>Provided as-is, during early access</h2>
          <p>
            eyewee is under active development and provided &ldquo;as is,&rdquo; without warranties of
            any kind, express or implied. To the fullest extent permitted by law, i4iSciences disclaims
            liability for decisions made, or outcomes experienced, in reliance on eyewee&rsquo;s
            responses. This page is a plain-language summary, not a substitute for our full Terms of
            Service, which will govern your use of eyewee.
          </p>
        </article>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <span>eyewee</span>
          <span className="landing-footer-muted">A product by i4iSciences&trade;</span>
        </div>
        <nav className="landing-footer-links">
          <Link href="/" className="landing-footer-link">
            Home
          </Link>
        </nav>
      </footer>
    </div>
  );
}
