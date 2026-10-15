import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { privacy } from "@/content/legal/generated";

export const metadata: Metadata = { title: "Privacy Policy · RenoSwap" };

export default function Page() {
  return <LegalPage title="Privacy Policy" markdown={privacy} />;
}
