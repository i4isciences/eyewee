import type { Metadata } from "next";
import { DocumentSearchDemo } from "@/components/document/DocumentSearchDemo";

export const metadata: Metadata = {
  title: "eyewee — Document Search",
};

export default function DocumentSearchDemoPage() {
  return <DocumentSearchDemo />;
}
