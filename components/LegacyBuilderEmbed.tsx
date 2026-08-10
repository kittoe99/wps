"use client";

import { useEffect, useRef } from "react";
import {
  ONBOARDING_LOCAL_DRAFT_KEY,
  onboardingPrompt,
  type LocalOnboardingDraft,
} from "@/lib/onboarding-agent";

const legacyBuilderUrl =
  process.env.NEXT_PUBLIC_LEGACY_BUILDER_URL || "http://localhost:3002";

export default function LegacyBuilderEmbed() {
  const frame = useRef<HTMLIFrameElement>(null);

  function handoffBrief() {
    try {
      const saved = window.localStorage.getItem(ONBOARDING_LOCAL_DRAFT_KEY);
      if (!saved) return;
      const draft = JSON.parse(saved) as LocalOnboardingDraft;
      frame.current?.contentWindow?.postMessage(
        { type: "wpscanvas:onboarding-brief", prompt: onboardingPrompt(draft) },
        new URL(legacyBuilderUrl).origin,
      );
    } catch {
      // An unavailable or malformed local draft must not block the builder.
    }
  }

  useEffect(() => {
    handoffBrief();
  }, []);

  return (
    <iframe
      ref={frame}
      title="WPS Canvas AI Website Builder"
      src={legacyBuilderUrl}
      className="h-full w-full border-0"
      allow="clipboard-read; clipboard-write"
      onLoad={handoffBrief}
    />
  );
}
