import type { Metadata } from "next";
import LegacyBuilderEmbed from "@/components/LegacyBuilderEmbed";

export const metadata: Metadata = {
  title: "Builder — wpscanvas",
  description: "Build and manage your WPS Canvas website with the AI agent.",
};

export default function BuilderPage() {
  return (
    <main className="h-dvh overflow-hidden bg-[#f7f7f4]">
      <LegacyBuilderEmbed />
    </main>
  );
}
