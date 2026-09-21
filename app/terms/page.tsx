import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Terms of Service — PostdocWorks",
  description: "The terms governing use of PostdocWorks, eyewee, and Doc2Postdoc.",
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service" updated="September 21, 2026">
      <LegalSection heading="1. Who this covers">
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your use of PostdocWorks, eyewee, and Doc2Postdoc (together, &ldquo;the Services&rdquo;),
          operated by I4I Sciences LLC dba i4iSciences (&ldquo;i4iSciences,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;). By joining the waitlist, creating an
          account, or otherwise using the Services, you agree to these Terms. If you don&rsquo;t agree, please don&rsquo;t use the Services.
        </p>
      </LegalSection>

      <LegalSection heading="2. Early access">
        <p>
          The Services are currently in early access. Features described on our website — including eyewee&rsquo;s live conversation, Doc2Postdoc
          matching, Ring the Bell, and Travel Companion — are not yet generally available. Joining the waitlist reserves your place; it does not
          guarantee a specific launch date, feature set, or that your field or metro area will open first.
        </p>
      </LegalSection>

      <LegalSection heading="3. Eligibility and your account">
        <p>
          You must be at least 18 years old to use the Services. When registration opens, one account covers PostdocWorks, eyewee, and Doc2Postdoc — you
          don&rsquo;t sign up for each separately. You&rsquo;re responsible for the accuracy of the information you give us (including on the waitlist
          form) and for keeping your account credentials secure once accounts exist.
        </p>
      </LegalSection>

      <LegalSection heading="4. Acceptable use">
        <p>You agree not to:</p>
        <p>
          • Misrepresent your identity, credentials, or affiliation when submitting information to us.
          <br />• Use the Services to harass, defraud, or endanger another person.
          <br />• Attempt to access accounts, data, or systems that aren&rsquo;t yours.
          <br />• Scrape, resell, or redistribute data from the Services without our written permission.
          <br />• Use the Services in a way that violates applicable law.
        </p>
      </LegalSection>

      <LegalSection heading="5. Verification and matching">
        <p>
          Credential verification (ORCID, PubMed, USPTO, faculty endorsement, and similar checks) reflects what we could confirm against the referenced
          records at the time of verification — it is not a guarantee of a person&rsquo;s qualifications, character, or fitness for any purpose. Doc2Postdoc
          matching, Ring the Bell, and Travel Companion connect you with other members; we do not vet every member&rsquo;s conduct, and you&rsquo;re
          responsible for your own judgment in any connection made through the Services.
        </p>
      </LegalSection>

      <LegalSection heading="6. eyewee">
        <p>
          eyewee is an AI-assisted feature. It can make mistakes, and its responses are not a substitute for professional medical, legal, immigration,
          tax, or financial advice, and are not equipped to handle a mental health crisis or emergency. See our{" "}
          <a href="/safety" style={{ color: "#182D5A", fontWeight: 600, textDecoration: "underline" }}>
            AI Safety &amp; Responsible Use
          </a>{" "}
          page for the full detail — it&rsquo;s part of these Terms by reference.
        </p>
      </LegalSection>

      <LegalSection heading="7. Intellectual property">
        <p>
          The Services, including their design, software, and the PostdocWorks, eyewee, and Doc2Postdoc names and marks, are owned by i4iSciences or its
          licensors. We don&rsquo;t claim ownership of the content you submit (your profile, credentials, messages), but by submitting it you give us a
          license to use it to operate and improve the Services — for example, to display your verified badges to other members, or to generate a
          requested document.
        </p>
      </LegalSection>

      <LegalSection heading="8. Termination">
        <p>
          You may stop using the Services, or ask us to delete your waitlist entry or account, at any time by emailing{" "}
          <a href="mailto:hello@postdocworks.io" style={{ color: "#182D5A", fontWeight: 600, textDecoration: "underline" }}>
            hello@postdocworks.io
          </a>
          . We may suspend or terminate access for conduct that violates these Terms or puts other members at risk.
        </p>
      </LegalSection>

      <LegalSection heading="9. Disclaimer and limitation of liability">
        <p>
          The Services are provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties of any kind, express or implied, during this
          early-access period and beyond. To the fullest extent permitted by law, i4iSciences will not be liable for indirect, incidental, or
          consequential damages arising from your use of the Services, or for decisions made in reliance on information from eyewee, a verified badge,
          or a Doc2Postdoc match.
        </p>
      </LegalSection>

      <LegalSection heading="10. Changes to these Terms">
        <p>
          We may update these Terms as the Services move out of early access. We&rsquo;ll update the date at the top of this page when we do, and for
          material changes, we&rsquo;ll email registered members and waitlist members in advance where practical.
        </p>
      </LegalSection>

      <LegalSection heading="11. Contact">
        <p>
          Questions about these Terms:{" "}
          <a href="mailto:hello@postdocworks.io" style={{ color: "#182D5A", fontWeight: 600, textDecoration: "underline" }}>
            hello@postdocworks.io
          </a>
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
