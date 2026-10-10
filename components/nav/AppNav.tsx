import Link from "next/link";

export type AppNavPage = "chat" | "leverage" | "document-search";

const LINKS: { key: AppNavPage; href: string; label: string }[] = [
  { key: "chat", href: "/home", label: "Chat" },
  { key: "leverage", href: "/leverage", label: "Leverage" },
  { key: "document-search", href: "/document-search", label: "Document Search" },
];

// Shared across every app surface (chat, Leverage, Document Search) so a postdoc always knows
// eyewee's other features exist, instead of discovering /leverage or /document-search by accident.
export function AppNav({ current }: { current: AppNavPage }) {
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
