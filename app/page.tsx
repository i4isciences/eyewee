import Link from "next/link";
import { Eye } from "@/components/eye/Eye";
import { Reveal } from "@/components/Reveal";

const CROSSINGS = [
  {
    kicker: "Translate",
    meaning: "language crossing",
    primary: "Say it your way. eyewee carries it the rest of the way.",
    alt: "No language should stand between you and your work.",
  },
  {
    kicker: "Navigate",
    meaning: "everyday-logistics crossing",
    primary: "The guide for everything nobody hands you on day one.",
    alt: "From visa paperwork to lab paperwork, one place to ask.",
  },
  {
    kicker: "Leverage",
    meaning: "cracking the unsolved project",
    primary: "Your PI handed you the hard problem. We help you crack it.",
    alt: "200 papers deep, one clear next step.",
  },
  {
    // Draft copy, not yet locked like the three above -- Trust is newly confirmed as eyewee's
    // fourth pillar (badge/verification layer + Doc2Postdoc's contact-sharing safety layer).
    kicker: "Trust",
    meaning: "verification & safety crossing",
    primary: "Your verified record travels with you. Your contact details stay yours to share.",
    alt: "Badges checked against ORCID and USPTO — not just claimed.",
  },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Link href="/" className="landing-brand">
            <svg className="landing-brand-mark" viewBox="0 0 40 24" aria-hidden="true">
              <path
                d="M2 12C7 4 15 1 20 1s13 3 18 11c-5 8-13 11-18 11S7 20 2 12Z"
                fill="none"
                stroke="var(--navy)"
                strokeWidth="1.6"
              />
              <circle cx="20" cy="12" r="5.4" fill="var(--gold)" />
              <circle cx="20" cy="12" r="2.3" fill="var(--navy)" />
            </svg>
            <span className="landing-wordmark">eyewee</span>
          </Link>
          <nav className="landing-nav-links">
            <Link href="/home" className="landing-nav-cta">
              Use eyewee
            </Link>
          </nav>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-eye">
            <Eye state="idle" size={150} />
          </div>
          <p className="landing-hero-kicker">eyewee</p>
          <h1 className="landing-hero-master">
            You say it — eyewee carries it, guides it, and cracks the toughest problems.
          </h1>
          <p className="landing-hero-sub">
            The AI companion for postdocs carrying someone else&rsquo;s unsolved dream project — alone,
            in a new country, with no time left over.
          </p>
          <div className="landing-hero-ctas">
            <Link href="/home" className="btn btn-gold">
              Use eyewee
            </Link>
            <a href="#crossings" className="btn btn-outline">
              See how it works
            </a>
          </div>
        </div>
      </section>

      <section className="landing-value">
        <Reveal className="landing-value-inner">
          <p className="landing-value-body">
            eyewee brings together the guidance, the connections, and the sparks of insight a postdoc
            needs to crack the project, find the way through, and stop carrying it alone.
          </p>
          <p className="landing-value-pull">Turns stuck into spark.</p>
        </Reveal>
      </section>

      <section id="crossings" className="landing-crossings">
        <div className="landing-crossings-inner">
          {CROSSINGS.map((crossing, index) => (
            <Reveal key={crossing.kicker} className="landing-crossing-card">
              <span className="landing-crossing-index">0{index + 1}</span>
              <h3 className="landing-crossing-kicker">{crossing.kicker}</h3>
              <p className="landing-crossing-meaning">{crossing.meaning}</p>
              <p className="landing-crossing-primary">{crossing.primary}</p>
              <p className="landing-crossing-alt">{crossing.alt}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="landing-problem">
        <Reveal className="landing-problem-inner">
          <p className="landing-problem-tag">the 200-paper wall</p>
          <p className="landing-problem-sub">Working alone isn&rsquo;t rigor. It&rsquo;s just noise.</p>
        </Reveal>
      </section>

      <section className="landing-close">
        <Reveal className="landing-close-inner">
          <p className="landing-close-line">
            eyewee doesn&rsquo;t just watch.
            <br />
            It sees.
          </p>
          <Link href="/home" className="btn btn-outline">
            Meet eyewee
          </Link>
        </Reveal>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <span>eyewee</span>
          <span className="landing-footer-muted">A product by i4iSciences&trade;</span>
        </div>
        <nav className="landing-footer-links">
          <Link href="/safety" className="landing-footer-link">
            AI Safety
          </Link>
        </nav>
      </footer>
    </div>
  );
}
