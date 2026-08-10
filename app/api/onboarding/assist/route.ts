import { NextResponse } from "next/server";

type AssistRequest = {
  field?: "description" | "differentiators" | "preferences";
  businessName?: string;
  industry?: string;
  services?: string[];
  goal?: string;
  audience?: string;
  tone?: string;
  currentValue?: string;
};

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production")
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key)
    return NextResponse.json(
      { error: "AI assistance is not configured" },
      { status: 503 },
    );
  try {
    const body = (await request.json()) as AssistRequest;
    if (!body.field)
      return NextResponse.json(
        { error: "A requested field is required" },
        { status: 400 },
      );
    const instruction =
      body.field === "description"
        ? "Write a warm, specific 2-sentence business description for a website. Do not invent certifications, pricing, years, guarantees, or claims."
        : body.field === "differentiators"
          ? "Suggest three concise differentiators for a website. State them as short plain-text phrases. Do not invent facts; frame anything uncertain as a service approach."
          : "Suggest one concise plain-text creative preference note for the web design team based on this business and chosen tone. Avoid technical implementation details.";
    const base = (
      process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1"
    ).replace(/\/$/, "");
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        temperature: 0.55,
        max_tokens: 220,
        messages: [
          {
            role: "user",
            content: `${instruction}\n\nBusiness: ${body.businessName || "a local business"}\nIndustry: ${body.industry || "general local services"}\nServices: ${(body.services || []).join(", ") || "not provided"}\nGoal: ${body.goal || "not provided"}\nAudience: ${body.audience || "not provided"}\nTone: ${body.tone || "not provided"}\nExisting note: ${body.currentValue || "none"}`,
          },
        ],
      }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };
    if (!response.ok)
      return NextResponse.json(
        { error: data.error?.message || "AI assistance failed" },
        { status: 502 },
      );
    const suggestion = data.choices?.[0]?.message?.content?.trim();
    if (!suggestion)
      return NextResponse.json(
        { error: "AI assistance returned no suggestion" },
        { status: 502 },
      );
    return NextResponse.json({ suggestion: suggestion.slice(0, 1600) });
  } catch (error) {
    console.error("onboarding assistance failed:", error);
    return NextResponse.json(
      { error: "AI assistance failed" },
      { status: 500 },
    );
  }
}
