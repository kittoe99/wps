# WPScanvas Website Guide

Last updated: 2026-08-10

## Purpose

WPScanvas is a conversion-focused website for local service businesses. Its central promise is **more booked jobs on autopilot**: attracting demand, responding while intent is high, and turning that demand into appointments.

The public site uses a minimal editorial visual system rather than a feature-heavy SaaS presentation. Copy should be direct, sales-led, and outcome-first.

## Public routes

| Route                 | Purpose                             | Primary message                                                        |
| --------------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| `/`                   | Homepage                            | More booked jobs. On autopilot.                                        |
| `/websites`           | AI Website Builder                  | A website built to fill your calendar.                                 |
| `/ai-phone-agent`     | AI Phone Agents                     | Every call answered. Every job captured.                               |
| `/ai-chatbot`         | AI Lead Agent                       | Turn questions into booked conversations.                              |
| `/reviews-generator`  | Automated Review Generation         | More five-star proof, without the chase.                               |
| `/contact`            | Lead/contact conversion page        | Let’s get your calendar working harder.                                |
| `/builder`            | AI Website Builder host             | Embeds the independently running local workspace builder.              |
| `/builder/onboarding` | Local AI Website Builder onboarding | Collect and review a browser-local website brief before build handoff. |
| `/login`, `/signup`   | Account access                      | Product/application authentication.                                    |

## Shared site structure

- `app/layout.tsx` provides global fonts, metadata, styles, and the shared site chrome.
- `components/SiteChrome.tsx` wraps public pages with the shared header and footer.
- `components/Header.tsx` contains the responsive navigation, product menu, and appointment CTA.
- `components/Footer.tsx` is a light, off-white footer with a centered 70%-width divider.
- `components/BrandMark.tsx` is the paired-bar WPScanvas logo. Reuse this component; do not redraw the mark inline.
- `components/ProductLanding.tsx` powers the four product-page layouts.
- `components/studio/Studio.tsx` and `components/studio/AgentActivity.tsx` power the AI Website Builder studio; its studio-only theme is scoped under `.wps-studio-theme` in `app/globals.css`.
- `components/ConnectedSystemIllustration.tsx` is the homepage’s code-native SVG illustration of web, phone, and review signals converging on an appointment.

## Homepage content model

The homepage should stay concise and follow this order:

1. Hero: core result, one primary CTA, and the dark “appointment engine” console.
2. System statement: “Growth doesn’t need more tools” plus the connected-system illustration.
3. Product system: four connected offers.
4. Conversion outcome: get found, respond, book.
5. Final CTA: put appointments on autopilot.

Avoid long capability inventories, generic agency positioning, extensive proof grids, or technical implementation details on the homepage.

## Design system

### Color

- Page surface: warm off-white `#f7f7f4` / `#f8f8f5`
- Ink: near-black `#0a0a0b`
- Dark product/system surface: `#111110`
- Accent: electric yellow-green `#d9ff4f`
- Secondary text: muted warm gray

The lime accent should be used sparingly for emphasis, active signals, and calls to action—not as a broad page background except for high-impact CTA areas.

### Typography and layout

- Use the local system font stacks defined in `app/globals.css`; do not add remote `next/font/google` imports, so local development does not depend on Google Fonts being reachable.
- Headlines are tightly tracked, large, and editorial. Keep them short.
- Use `.growth-shell` for the shared page width.
- Use `.growth-kicker` for small all-caps section labels.
- Prefer generous whitespace, clear dividers, and a small number of strong components.

### Icons and illustrations

- Use `lucide-react` for interface icons.
- Prefer the existing code-native SVG/React illustration style for product/system visuals.
- Do not add generic stock photography, dense charts, or image-based dashboards unless specifically required.
- Use the paired-bar `BrandMark` component for the logo in shared chrome.

## Navigation behavior

- Desktop: product dropdown with an icon, a concise product description, and an appointment CTA.
- Mobile: icon-only menu trigger; the drawer lists product pages with icons and descriptions, then secondary links and CTA.
- The main CTA should consistently point to `/contact` and use appointment-focused language.

## AI Website Builder studio and onboarding

`/builder` embeds the original local workspace builder running independently at `http://localhost:3002` (or `NEXT_PUBLIC_LEGACY_BUILDER_URL`). Its chat, preview, model selection, local workspaces, and agent process stay in the original builder project, so a refresh or restart of the main marketing app does not terminate a builder run. Run the embedded builder as a production server (`npm run build`, then `npm run start -- --port 3002`) to avoid the unstable development watcher. Builder routes deliberately omit the marketing header and footer to give the embedded studio the full viewport.

The guided website brief is available at `/builder/onboarding` without sign-in during the local testing phase. The AI Website Builder marketing page remains available at `/websites`; its CTA buttons point to onboarding, and `/builder` also exposes onboarding as the preferred new-site flow.

The onboarding saves a user-owned draft and collects only the core direction the customer can answer confidently: business, industry and specific business type, structured service coverage, state and city primary-market selection (or an actual business address), travel range, business-type-aware selectable services with custom additions, target customer, growth goal, CTA, brand tone, and visual preference. During the current testing phase, every field is optional and an empty brief may be saved as ready. Technical implementation and research details are intentionally deferred to the future agent workflow.

Drafts auto-save in browser `localStorage` and resume on the same browser/device. A completed review opens `/builder` with a formatted copy of the brief staged in the builder prompt field. It does **not** start a build, call the agent, or write to the database; the customer must explicitly select Build.

The builder agent uses the WPS Canvas system prompt in `lib/agent/prompts.ts`. It treats the staged customer onboarding brief as the factual source of truth, prevents invention of business claims, and directs research only to support—not override—the customer brief.

The stored brief model retains research-ready fields for future Firecrawl use (search, scrape, crawl, screenshot, and image discovery). The location step includes an optional, protected live web lookup that uses the business name plus selected city and state to suggest likely business matches; the customer selects and verifies any suggestion before it is stored. It does not run website research or modify agent behavior.

The onboarding provides optional DeepSeek writing assistance for the business description and customer-facing differentiator fields, plus optional Firecrawl location lookup. These local-development-only endpoints use local environment configuration; model credentials are never sent to the browser.

## Local sign-in behavior

The sign-in page uses the same charcoal, off-white, and lime visual system as the builder. In non-production environments it exposes a **Continue to builder** shortcut that creates a local demo account/session without credentials. The supporting endpoint returns 404 in production, where normal email/password authentication remains required.

## Updating this document

Update this document in the same change whenever any of the following change:

- a public route, page purpose, headline, product name, or CTA;
- the shared header, footer, logo, navigation behavior, or contact flow;
- the visual system, primary colors, typography, or shared layout rules;
- an introduced, removed, or substantially redesigned shared component.

Keep the “Last updated” date current. For implementation-only changes that do not alter user-facing behavior or the design system, no documentation update is required.
