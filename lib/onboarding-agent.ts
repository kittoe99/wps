import type { OnboardingBrief } from "@/lib/onboarding";

export const ONBOARDING_LOCAL_DRAFT_KEY =
  "wpscanvas.website-onboarding.draft.v1";

export type LocalOnboardingDraft = {
  businessName: string;
  industry: string;
  brief: OnboardingBrief;
  step: number;
  status: "draft" | "ready";
};

const detail = (label: string, value: string | string[]) => {
  const text = Array.isArray(value)
    ? value.filter(Boolean).join(", ")
    : value.trim();
  return text ? `- ${label}: ${text}` : "";
};

export function onboardingPrompt(draft: LocalOnboardingDraft) {
  const { businessName, industry, brief } = draft;
  const lines = [
    detail("Business", businessName),
    detail("Industry", industry),
    detail("Business type", brief.businessType),
    detail("About the business", brief.businessDescription),
    detail("Primary services", brief.primaryServices),
    detail("Primary market", brief.businessAddress || brief.primaryMarket),
    detail("Service coverage", brief.serviceCoverage),
    detail("Travel range", brief.travelRange),
    detail("Ideal customers", brief.idealCustomers),
    detail("Primary conversion goal", brief.primaryGoal),
    detail("Preferred CTA", brief.primaryCta),
    detail("Differentiators", brief.differentiators),
    detail("Brand tone", brief.brandTone),
    detail("Visual direction", brief.visualDirection),
    detail("Customer notes", brief.copyNotes),
  ].filter(Boolean);

  return `Create a conversion-focused website using this customer-approved onboarding brief as the source of truth. Preserve stated facts, do not invent credentials, pricing, guarantees, locations, or testimonials, and use research only to add appropriate context and inspiration.

## Customer onboarding brief
${lines.length ? lines.join("\n") : "- No details were provided yet. Ask for the essentials before building."}

## First build request
Plan and build a polished, responsive website that makes the preferred customer action obvious. Use the brief above before making design, copy, page structure, or research decisions.`;
}
