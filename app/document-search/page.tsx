import type { Metadata } from "next";
import { DocumentSearchDemo } from "@/components/document/DocumentSearchDemo";
import { ConsentGate } from "@/components/ConsentGate";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "eyewee — Document Search",
};

export default function DocumentSearchDemoPage() {
  return (
    <ConsentGate>
      <DocumentSearchDemo />
      <SiteFooter />
    </ConsentGate>
  );
}
