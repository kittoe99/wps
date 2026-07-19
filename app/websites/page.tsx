import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI-Native Websites — wpscanvas",
  description:
    "We engineer growth systems with AI chatbots, semantic SEO, and intelligent lead management baked into every site.",
}

const engines = [
  {
    title: "AI Chatbots That Actually Close",
    description:
      "Not generic FAQ bots. We train custom conversational agents on your proprietary data — your product specs, your sales scripts, your support tickets. They qualify leads 24/7, handle objection-handling logic, and only escalate to a human when the intent signal is hot enough. They learn from every failed interaction and get smarter each week.",
  },
  {
    title: "SEO That Predicts, Not Reacts",
    description:
      "We abandoned keyword-density thinking years ago. Our approach is semantic and intent-driven. We build topic clusters based on what your customers are actually searching for across the entire funnel — not just what your competitors rank for. Schema, internal linking, and content scaffolding are baked into the architecture, not bolted on post-launch.",
  },
  {
    title: "Lead Management as a Core Feature",
    description:
      "Every visitor leaves a trail. We capture it intelligently — not just email addresses, but behavioral signals: what they clicked, how long they lingered, what they ignored. That data routes directly into your CRM with scoring logic attached, so your sales team only touches leads that are ready to talk.",
  },
]

const services = [
  {
    title: "AI-Native Website Development",
    body: "This is our flagship offering. We build custom, headless-friendly front-ends on a back-end stack of your choice (WordPress, Next.js, or a fully custom Node environment). But the real value isn't the code — it's the Canvas Core, our proprietary integration layer that pre-wires AI, analytics, and automation into the DNA of the site. You don't install plugins for chat, SEO, or forms. They're native. That means sub-2-second load times, zero bloat, and a security footprint that's lean and auditable.",
  },
  {
    title: "AI Chatbot & Conversational Interface",
    body: "Generic chatbots fail because they lack context. We spend the first two weeks of every chatbot project ingesting your knowledge base, past sales calls, and support transcripts. We map decision trees not just for \"what\" people ask, but why they're asking it. The result is a conversational agent that can handle product discovery, troubleshooting, pricing negotiations, and even scheduling — with a smooth, context-preserving handoff to a human when the nuance exceeds logic. We also retrain these models monthly based on real conversation logs, so they evolve with your business.",
  },
  {
    title: "SEO & Content Intelligence",
    body: "We treat SEO as a continuous intelligence operation, not a one-time audit. We layer in automated internal linking, dynamic meta-generation, and entity-based content frameworks. Our reporting doesn't just show you rankings; it shows you market share — which queries you're winning, which ones are slipping, and exactly what content needs to be created to close the gap. We also integrate with your existing content calendar to suggest topics that have high search volume and high buyer intent, saving your writers from guessing.",
  },
  {
    title: "Lead Management & CRM Sync",
    body: "This is where most sites leak value. We install smart lead capture that uses conditional logic and behavioral triggers — so a returning visitor sees a different form than a first-timer. Abandoned form recovery workflows trigger automated emails or SMS nudges. And the entire lead history (source, page views, chat transcripts, form answers) syncs in real-time to HubSpot, Salesforce, or Pipedrive with custom property mapping. Your sales team doesn't log in to your website dashboard; they see the intelligence right inside their daily workflow.",
  },
  {
    title: "Ongoing Growth Retainer",
    body: "Post-launch isn't maintenance — it's optimization. Our retainers are active partnerships: monthly performance reviews, iterative chatbot retraining, fresh SEO content pushes, security hardening, and a quarterly strategy session where we re-align your digital presence with your evolving business goals. We don't just keep the lights on; we keep the engine tuned.",
  },
]

const features = [
  {
    label: "Canvas AI Chatbot",
    detail:
      "Trained on your proprietary corpus. Handles 70%+ of routine inquiries without human touch. Escalates with full context when needed.",
  },
  {
    label: "Semantic SEO Engine",
    detail:
      "Native topic discovery, content scoring, and snippet optimization. No third-party bloat.",
  },
  {
    label: "LeadFlow Manager",
    detail:
      "A visual, real-time dashboard that shows every lead's journey: source, scroll behavior, interaction heat, and conversion path.",
  },
  {
    label: "Dynamic Personalization",
    detail:
      "Content, offers, and calls-to-action shift based on user behavior, geography, or referral source — all managed without developer intervention.",
  },
  {
    label: "Real-Time Micro-Analytics",
    detail:
      "We go beyond pageviews. We track hover patterns, rage clicks, AI interaction quality, and form abandonment fields. We know where your user got stuck.",
  },
  {
    label: "Native Multi-Channel Integration",
    detail:
      "Native connectors for email, SMS, calendar, and social platforms. No reliance on third-party automation zaps.",
  },
  {
    label: "Enterprise-Grade Security & Compliance",
    detail:
      "GDPR, CCPA, and cookie consent are table stakes. We include daily backups, Web Application Firewall, and DDoS protection as standard.",
  },
]

export default function WebsitesPage() {
  return (
    <main className="min-h-screen bg-[#fcfaf8]">
      {/* Hero — The Problem */}
      <section className="bg-[#fcfaf8] border-b border-[#dbd9d7]">
        <div className="u-container pt-14 md:pt-20 lg:pt-24 pb-10 md:pb-14">
          <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-8 lg:gap-14 xl:gap-20 items-start">
            <h1 className="text-hero-sans max-w-3xl animate-fade-in">
              Most websites are{" "}
              <span className="hero-underline">digital fossils</span>
            </h1>
            <p className="font-sans-ui text-base md:text-[0.9375rem] leading-relaxed text-[#3d3d3a] lg:pt-6 xl:pt-10 max-w-md lg:max-w-none animate-fade-in-delayed">
              They are static, reactive, and fundamentally disconnected from how modern B2B buyers behave. Buyers expect instant answers, personalized experiences, and frictionless handoffs. Instead, they get contact forms that disappear into the void, chatbots that can&apos;t answer basic questions, and SEO strategies built for 2015.
            </p>
          </div>
        </div>
      </section>

      {/* The Gap */}
      <section className="bg-[#fcfaf8]">
        <div className="u-container py-12 md:py-16">
          <div className="card-hero-dark px-8 md:px-12 lg:px-16 py-12 md:py-16 lg:py-20">
            <h2>The gap isn&apos;t just technical — it&apos;s philosophical.</h2>
            <p className="mt-5 md:mt-6">
              Most agencies build for aesthetics first and retrofit performance later. By the time the site launches, the market has already moved. The result is a beautiful liability, not a functional asset.
            </p>
            <Link href="#engines" className="inline-flex items-center gap-2 mt-8 md:mt-10">
              See our approach
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* The WPScanvas Solution */}
      <section id="engines" className="bg-[#fcfaf8] border-t border-[#dbd9d7]">
        <div className="u-container py-16 md:py-24 lg:py-28">
          <h2 className="text-section-label mb-4">
            We don&apos;t build websites. We engineer{" "}
            <span className="text-[#d97759]">growth systems</span>.
          </h2>
          <p className="font-sans-ui text-base md:text-[0.9375rem] leading-relaxed text-[#3d3d3a] max-w-2xl mb-10 md:mb-14">
            Every project we ship is built on a single, non-negotiable foundation: the site must
            generate measurable, attributable business outcomes from day one. To achieve that, we
            embed three core engines into every build.
          </p>
          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {engines.map((engine) => (
              <article key={engine.title} className="card-manilla flex flex-col p-6 md:p-8">
                <h4 className="font-sans-ui text-xl md:text-[1.25rem] font-semibold leading-tight text-[#141413] mb-3">
                  {engine.title}
                </h4>
                <p className="font-sans-ui text-sm md:text-[0.875rem] leading-relaxed text-[#3d3d3a] flex-1">
                  {engine.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Service Deep-Dives */}
      <section className="bg-[#fcfaf8] border-t border-[#dbd9d7]">
        <div className="u-container py-16 md:py-24 lg:py-28">
          <h2 className="text-section-label mb-10 md:mb-14">Service Deep-Dives</h2>
          <div className="space-y-8">
            {services.map((service) => (
              <article
                key={service.title}
                className="border border-[#dbd9d7] rounded-2xl p-6 md:p-8 bg-white"
              >
                <h3 className="font-sans-ui text-lg md:text-xl font-semibold leading-tight text-[#141413] mb-3">
                  {service.title}
                </h3>
                <p className="font-sans-ui text-sm md:text-[0.875rem] leading-relaxed text-[#3d3d3a] max-w-4xl">
                  {service.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* The 7 Core Features */}
      <section className="bg-[#fcfaf8] border-t border-[#dbd9d7]">
        <div className="u-container py-16 md:py-24 lg:py-28">
          <h2 className="text-section-label mb-4">
            The 7 Core Features
          </h2>
          <p className="font-sans-ui text-sm md:text-[0.875rem] leading-relaxed text-[#6b6b6b] max-w-xl mb-10 md:mb-14">
            Every site we ship contains these seven built-in capabilities, regardless of tier.
          </p>
          <div className="border-t border-[#dbd9d7]">
            {features.map((feature, index) => (
              <div
                key={feature.label}
                className={`flex items-start justify-between gap-6 py-5 ${
                  index < features.length - 1 ? "border-b border-[#dbd9d7]" : ""
                }`}
              >
                <span className="font-sans-ui text-base md:text-lg font-semibold text-[#141413] shrink-0 w-1/3 md:w-1/4">
                  {feature.label}
                </span>
                <span className="font-sans-ui text-sm text-[#3d3d3a] leading-relaxed">
                  {feature.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#fcfaf8] border-t border-[#dbd9d7]">
        <div className="u-container py-12 md:py-16 text-center">
          <Link href="/contact" className="btn-pill-dark">
            Let&apos;s talk about your website
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  )
}
