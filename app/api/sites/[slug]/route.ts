import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  ensureSitesSchema,
  getSiteForUser,
  listBuildsForSite,
  updateSiteBrief,
  updateSiteOnboarding,
  buildToClient,
} from "@/lib/sites";
import type { OnboardingBrief } from "@/lib/onboarding";

type Ctx = { params: Promise<{ slug: string }> };

function isUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function onboardingError(brief: OnboardingBrief, ready: boolean) {
  const values = Object.values(brief);
  if (values.some((value) => typeof value === "string" && value.length > 6000))
    return "One or more fields are too long";
  const listsForLimits = values.filter(Array.isArray) as string[][];
  if (
    listsForLimits.some(
      (list) =>
        list.length > 20 ||
        list.some((item) => typeof item !== "string" || item.length > 500),
    )
  )
    return "List fields may contain up to 20 short entries";
  if (!ready) return null;
  const hasEmail =
    !brief.publicEmail.trim() || /^\S+@\S+\.\S+$/.test(brief.publicEmail);
  const phoneDigits = brief.publicPhone.replace(/\D/g, "");
  if (!hasEmail || (brief.publicPhone.trim() && phoneDigits.length < 7))
    return "Enter a valid public email address or phone number";
  const urlFields = [
    brief.bookingUrl,
    brief.currentWebsiteUrl,
    brief.googleBusinessUrl,
    ...brief.assetUrls,
    ...brief.socialUrls,
    ...brief.competitorUrls,
    ...brief.inspirationUrls,
  ].filter(Boolean);
  if (urlFields.some((url) => !isUrl(url))) return "Enter valid http(s) URLs";
  return null;
}

export async function GET(_request: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await ctx.params;
  try {
    await ensureSitesSchema();
    const site = await getSiteForUser(user.id, slug);
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }
    const builds = await listBuildsForSite(site.id);
    return NextResponse.json({
      site,
      builds: builds.map(buildToClient),
    });
  } catch (err) {
    console.error("get site:", err);
    return NextResponse.json({ error: "Failed to load site" }, { status: 500 });
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await ctx.params;
  try {
    await ensureSitesSchema();
    const body = (await request.json()) as {
      businessName?: string;
      industry?: string;
      tone?: string;
      title?: string;
      onboarding?: OnboardingBrief;
      onboardingStatus?: "draft" | "ready";
    };
    if (body.onboarding) {
      const error = onboardingError(
        body.onboarding,
        body.onboardingStatus === "ready",
      );
      if (error) return NextResponse.json({ error }, { status: 400 });
    }
    const site = body.onboarding
      ? await updateSiteOnboarding(user.id, slug, {
          businessName: body.businessName || "",
          industry: body.industry || "",
          title: body.title || "Untitled website brief",
          brief: body.onboarding,
          status: body.onboardingStatus === "ready" ? "ready" : "draft",
        })
      : await updateSiteBrief(user.id, slug, {
          businessName: body.businessName || "",
          industry: body.industry || "",
          tone: body.tone,
          title: body.title || "Untitled website brief",
        });
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }
    return NextResponse.json({ site });
  } catch (err) {
    console.error("patch site:", err);
    return NextResponse.json(
      { error: "Failed to update site" },
      { status: 500 },
    );
  }
}
