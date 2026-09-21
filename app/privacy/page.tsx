import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy — PostdocWorks",
  description: "What PostdocWorks, eyewee, and Doc2Postdoc collect, and how it's used.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy" updated="September 21, 2026">
      <LegalSection heading="1. What we collect">
        <p>Right now, during early access, the only data we collect is what you give us on the waitlist form:</p>
        <p>
          • Your full name and email address
          <br />• Career stage (postdoc, PhD student, medical resident/fellow, faculty/PI, or other)
          <br />• Research field, institution, and city/metro area, if you choose to share them
          <br />• The timestamp you gave consent
        </p>
        <p>
          Once accounts, eyewee conversations, and Doc2Postdoc matching are live, this policy will be updated to cover that additional data — including
          conversation history, credential-verification data (ORCID, PubMed, USPTO, and similar), and connection/matching activity — before those
          features go live.
        </p>
      </LegalSection>

      <LegalSection heading="2. How we use it">
        <p>
          • To email you when eyewee and Doc2Postdoc open in your field and metro, and about other product updates you&rsquo;d reasonably expect from
          joining an early-access list.
          <br />• To understand demand by field, career stage, and location, so we open metros and fields in a sensible order.
          <br />• To operate, secure, and improve the Services.
        </p>
        <p>We don&rsquo;t sell your data, and we don&rsquo;t use it for third-party advertising.</p>
      </LegalSection>

      <LegalSection heading="3. Who we share it with">
        <p>
          We share data with service providers who help us run the Services under contract — currently, our database and hosting infrastructure
          (Supabase) and our deployment platform. We don&rsquo;t share your information with other members, employers, or anyone else without your
          separate consent, except as required by law.
        </p>
      </LegalSection>

      <LegalSection heading="4. How long we keep it">
        <p>
          Waitlist data is kept until you ask us to delete it, or until a reasonable period after early access ends and you haven&rsquo;t converted to a
          full account. You can ask for deletion at any time — see &ldquo;Your rights&rdquo; below.
        </p>
      </LegalSection>

      <LegalSection heading="5. Your rights">
        <p>
          You can ask us to access, correct, or delete the information we hold about you at any time by emailing{" "}
          <a href="mailto:hello@postdocworks.io" style={{ color: "#182D5A", fontWeight: 600, textDecoration: "underline" }}>
            hello@postdocworks.io
          </a>
          . We&rsquo;ll respond and act on verified requests within a reasonable time.
        </p>
      </LegalSection>

      <LegalSection heading="6. Cookies and tracking">
        <p>
          The waitlist page itself does not currently set marketing or analytics cookies. If that changes as the product grows, we&rsquo;ll update this
          section to describe exactly what&rsquo;s used and how to opt out.
        </p>
      </LegalSection>

      <LegalSection heading="7. Children's privacy">
        <p>The Services are intended for postdocs, PhD students, residents/fellows, and faculty — not for children. We do not knowingly collect data from anyone under 18.</p>
      </LegalSection>

      <LegalSection heading="8. Changes to this policy">
        <p>
          We&rsquo;ll update the date at the top of this page whenever this policy changes, and for material changes — especially as we move from
          waitlist-only data collection into live accounts, eyewee conversations, and matching — we&rsquo;ll notify waitlist and registered members by
          email in advance where practical.
        </p>
      </LegalSection>

      <LegalSection heading="9. Contact">
        <p>
          Questions about this policy, or a request about your data:{" "}
          <a href="mailto:hello@postdocworks.io" style={{ color: "#182D5A", fontWeight: 600, textDecoration: "underline" }}>
            hello@postdocworks.io
          </a>
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
