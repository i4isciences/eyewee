import Link from "next/link";
import type { ReactNode } from "react";
import { EyePair } from "@/components/eye3d/EyePair";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="auth-page">
      <div className="glow-field" />
      <Link href="/" className="auth-back">
        eyewee
      </Link>
      <div className="auth-card">
        <div className="auth-card-eye">
          <EyePair state="wake" size={54} />
        </div>
        <h1 className="auth-title">{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
        {children}
        <div className="auth-footer">{footer}</div>
      </div>
    </div>
  );
}
