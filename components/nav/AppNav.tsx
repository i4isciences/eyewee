import Link from "next/link";

export type AppNavPage = "leverage" | "document-search";

// "Chat" isn't a separate nav link here -- the wordmark below already goes to /home, and having
// both say the same thing was flagged as confusing duplication (pre-launch checklist, item 1).
const LINKS: { key: AppNavPage; href: string; label: string }[] = [
  { key: "leverage", href: "/leverage", label: "Leverage" },
  { key: "document-search", href: "/document-search", label: "Document Search" },
];

// Shared across every app surface (chat, Leverage, Document Search) so a postdoc always knows
// eyewee's other features exist, instead of discovering /leverage or /document-search by accident.
// `current` is omitted on /home -- the wordmark itself already represents "you're on chat", and
// neither LINKS entry applies there.
export function AppNav({ current }: { current?: AppNavPage }) {
  return (
    <nav className="app-nav">
      <Link href="/home" className="app-nav-wordmark">
        eyewee
      </Link>
      <div className="app-nav-links">
        {LINKS.map((link) => (
          <Link key={link.key} href={link.href} className={`app-nav-link${link.key === current ? " is-active" : ""}`}>
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
