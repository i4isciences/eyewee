import Link from "next/link";
import type { ReactNode } from "react";
import { Eye } from "@/components/eye/Eye";

export function LegalPageShell({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div style={{ width: "100%", boxSizing: "border-box", background: "#FFFFFF", fontFamily: "'Work Sans', sans-serif", color: "#1C2333" }}>
      <div
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "22px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #ECE7DD",
          position: "sticky",
          top: 0,
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(6px)",
          zIndex: 20,
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Eye state="idle" size={36} interactive={false} />
          <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "19px", letterSpacing: "-0.01em", color: "#182D5A" }}>eyewee</div>
        </Link>
        <Link href="/#waitlist" style={{ fontFamily: "'Work Sans', sans-serif", fontWeight: 600, fontSize: "14px", color: "#FFFFFF", background: "#182D5A", padding: "10px 20px", borderRadius: "8px" }}>
          Join the waitlist
        </Link>
      </div>

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "72px 32px 96px" }}>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "32px", color: "#182D5A", marginBottom: "10px" }}>{title}</h1>
        <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13.5px", color: "#8A93A6", marginBottom: "48px" }}>Last updated {updated}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>{children}</div>
      </div>

      <div
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "40px 48px",
          background: "#FFFFFF",
          borderTop: "1px solid #ECE7DD",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", gap: "18px", fontSize: "12.5px", color: "#8A93A6" }}>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <a href="mailto:hello@postdocworks.io">hello@postdocworks.io</a>
        </div>
        <div style={{ fontSize: "11.5px", color: "#B7BEC9", maxWidth: "520px", lineHeight: 1.6 }}>
          © 2026 I4I Sciences LLC dba i4iSciences. i4iSciences&trade; is a trademark of I4I Sciences LLC. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "18px", color: "#182D5A", marginBottom: "10px" }}>{heading}</h2>
      <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "14.5px", lineHeight: 1.75, color: "#384057", display: "flex", flexDirection: "column", gap: "10px" }}>
        {children}
      </div>
    </section>
  );
}
