import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "eyewee — Access",
  robots: { index: false, follow: false },
};

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="access-gate">
      <div className="access-gate-card">
        <p className="access-gate-kicker">EYEWEE — PRIVATE PREVIEW</p>
        <h1>Enter the access code</h1>
        <p className="access-gate-sub">This site isn&rsquo;t public yet. Ask i4iSciences for the code if you don&rsquo;t have it.</p>
        <form method="POST" action="/api/access/verify" className="access-gate-form">
          <input type="hidden" name="next" value={next ?? "/"} />
          <input type="password" name="code" placeholder="Access code" autoFocus required autoComplete="off" />
          <button type="submit">Continue</button>
        </form>
        {error ? <p className="access-gate-error">That code didn&rsquo;t work. Try again.</p> : null}
      </div>
    </div>
  );
}
