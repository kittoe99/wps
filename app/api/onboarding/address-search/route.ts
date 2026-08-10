import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production")
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key)
    return NextResponse.json(
      { error: "Live location search is not configured" },
      { status: 503 },
    );
  const body = (await request.json().catch(() => ({}))) as {
    businessName?: string;
    city?: string;
    state?: string;
  };
  const businessName = body.businessName?.trim() || "";
  const location = [body.city?.trim(), body.state?.trim()]
    .filter(Boolean)
    .join(", ");
  if (!businessName || !location)
    return NextResponse.json(
      { error: "Add a business name, state, and city before searching" },
      { status: 400 },
    );
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `"${businessName}" ${location} address`,
        limit: 5,
        sources: [{ type: "web" }],
      }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      data?: {
        web?: Array<{ title?: string; description?: string; url?: string }>;
      };
      error?: string;
    };
    if (!response.ok)
      return NextResponse.json(
        { error: data.error || "Live location search failed" },
        { status: 502 },
      );
    const suggestions = (data.data?.web || [])
      .map((item) => ({
        label: [item.title, item.description]
          .filter(Boolean)
          .join(" — ")
          .slice(0, 300),
        url: item.url || "",
      }))
      .filter((item) => item.label);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("address search failed:", error);
    return NextResponse.json(
      { error: "Live location search failed" },
      { status: 500 },
    );
  }
}
