// Shared footer for the app surfaces that don't already have one (the landing page, legal pages,
// and /safety each have their own equivalent already). Pre-launch checklist (2026-10-18, item 4):
// "Add a footer on every page: Terms | Privacy | hello@postdocworks.ai | Powered by i4iSciences."
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span className="site-footer-brand">Powered by i4iSciences&trade;</span>
      <nav className="site-footer-links">
        <a href="/terms">Terms</a>
        <a href="/privacy">Privacy</a>
        <a href="mailto:hello@postdocworks.ai">hello@postdocworks.ai</a>
      </nav>
    </footer>
  );
}
