import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Chatbot — wpscanvas",
  description:
    "A custom-trained conversational agent that qualifies leads, handles objections, and books appointments 24/7 — built on your proprietary data.",
}

const capabilities = [
  {
    title: "Trained on Your Business, Not Generic Data",
    description:
      "Most chatbots ship with a handful of FAQ responses and a prayer. Ours is different. Before launch, we ingest your product specs, sales scripts, support tickets, past customer conversations, and pricing logic. The result is an agent that understands your business as deeply as your best salesperson — and it only gets sharper over time as it learns from every conversation.",
  },
  {
    title: "Qualifies Leads Before They Reach Your Inbox",
    description:
      "Not every website visitor is ready to buy. Our chatbot separates tire-kickers from qualified buyers using conversational qualification logic — asking the right questions at the right time, scoring intent based on behavior and language signals, and only escalating leads that meet your criteria. Your sales team spends time closing, not filtering.",
  },
  {
    title: "Handles Objections Like a Seasoned Closer",
    description:
      "We map your most common objections — pricing concerns, competitor comparisons, timing hesitations — and build decision trees that handle them conversationally. The chatbot doesn't just deflect; it persuades. It offers case studies, ROI calculators, and social proof at exactly the moment a prospect needs reassurance. When the objection is too nuanced, it escalates with full context.",
  },
]

const services = [
  {
    title: "Custom AI Training & Knowledge Ingestion",
    body: "The first two weeks of every deployment are dedicated to knowledge transfer. We ingest your website content, product documentation, sales call transcripts, support ticket history, and any internal wikis or SOPs you provide. We then map the full customer journey — from first question to closed deal — identifying every branch, objection, and decision point a real conversation might take. The training data is proprietary to you and never mixed with other clients. The result is a chatbot that doesn't sound like a generic AI; it sounds like someone who's worked at your company for five years.",
  },
  {
    title: "24/7 Lead Capture & Qualification",
    body: "Your website never sleeps, and neither should your sales pipeline. The chatbot operates around the clock, engaging visitors in natural conversation — not canned scripts. It answers product questions, shares pricing (when appropriate), addresses common objections, and qualifies leads based on the criteria you define. When a lead reaches your qualification threshold, the chatbot either books a meeting directly into your calendar or routes the lead to the right salesperson with a full conversation summary. Nothing falls through the cracks because there are no cracks.",
  },
  {
    title: "Multi-Platform Deployment",
    body: "Your chatbot lives wherever your customers are. We deploy as a native widget on your website, but we can also integrate with WhatsApp, Facebook Messenger, Instagram DMs, and SMS — all powered by the same AI brain. A lead who starts a conversation on Instagram can continue it on your website without losing context. Every interaction across every channel feeds into the same lead profile inside your CRM, giving you a unified view of every prospect's journey.",
  },
  {
    title: "Conversation Analytics & Insights",
    body: "Every chat is logged, categorized, and searchable. We surface the questions your customers ask most — the ones your website doesn't answer, the ones your sales team hears on repeat, the ones that make prospects hesitate. This data feeds directly into your content strategy, your sales training, and your product roadmap. You'll know exactly what's working and what's leaking, down to the specific message where prospects drop off. Our monthly reports translate raw conversation data into actionable business intelligence.",
  },
  {
    title: "Monthly Retraining & Evolution",
    body: "Static chatbots decay. Yours won't. Every month, we audit the previous month's conversation logs, identify failure points — conversations the bot couldn't complete, questions it deflected, leads it misqualified — and retrain the model to handle those scenarios. We also incorporate your latest product updates, pricing changes, and seasonal offers. The chatbot doesn't just stay current; it compounds its knowledge over time, becoming more effective with every passing month.",
  },
]

const features = [
  {
    label: "Proprietary Knowledge Base",
    detail:
      "Your chatbot is trained exclusively on your data — products, pricing, sales scripts, support docs. Nothing is generic. Nothing is shared across clients.",
  },
  {
    label: "Conversational Intelligence",
    detail:
      "Natural language understanding that handles slang, typos, industry jargon, and multi-turn conversations without losing context or requiring clarification.",
  },
  {
    label: "Lead Scoring Engine",
    detail:
      "Custom qualification logic scores every conversation based on intent signals, behavioral patterns, and your predefined criteria. Your CRM only sees warm leads.",
  },
  {
    label: "Live Calendar Booking",
    detail:
      "Qualified leads can book meetings directly through the chat interface, with real-time availability pulled from Google Calendar or Office 365. No back-and-forth emails.",
  },
  {
    label: "Omnichannel Sync",
    detail:
      "Deploy on your website, WhatsApp, Messenger, Instagram, and SMS — all powered by the same AI brain with unified conversation history and lead profiles.",
  },
  {
    label: "Human Handoff with Context",
    detail:
      "When escalation is needed, the handoff includes the full chat transcript, lead score, and conversation summary — your team picks up where the AI left off.",
  },
  {
    label: "GDPR & CCPA Compliant",
    detail:
      "All chat data is encrypted in transit and at rest. Conversation logs are stored in your region. Data retention and deletion policies are configurable.",
  },
]

export default function AIChatbotPage() {
  return (
    <main className="min-h-screen bg-[#fcfaf8]">
      {/* Hero — The Problem */}
      <section className="bg-[#fcfaf8] border-b border-[#dbd9d7]">
        <div className="u-container pt-14 md:pt-20 lg:pt-24 pb-10 md:pb-14">
          <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-8 lg:gap-14 xl:gap-20 items-start">
            <h1 className="text-hero-sans max-w-3xl animate-fade-in">
              Your website gets traffic.{" "}
              <span className="hero-underline">It doesn&apos;t close deals</span>
            </h1>
            <p className="font-sans-ui text-base md:text-[0.9375rem] leading-relaxed text-[#3d3d3a] lg:pt-6 xl:pt-10 max-w-md lg:max-w-none animate-fade-in-delayed">
              Visitors land on your site, browse for 90 seconds, and leave. Most never fill out a form. The few who do wait 12+ hours for a response — by which point they&apos;ve already forgotten why they reached out. The gap between traffic and revenue isn&apos;t a marketing problem. It&apos;s a conversation problem.
            </p>
          </div>
        </div>
      </section>

      {/* The Gap */}
      <section className="bg-[#fcfaf8]">
        <div className="u-container py-12 md:py-16">
          <div className="card-hero-dark px-8 md:px-12 lg:px-16 py-12 md:py-16 lg:py-20">
            <h2>Contact forms are where leads go to die. Generic chatbots aren&apos;t much better.</h2>
            <p className="mt-5 md:mt-6">
              The average website converts under 3% of visitors. Live chat tools promise engagement but deliver canned responses that frustrate more than they help. Hiring 24/7 sales coverage is cost-prohibitive for most businesses. The result: you&apos;re paying for traffic you can&apos;t convert. There&apos;s a smarter path.
            </p>
            <Link href="#capabilities" className="inline-flex items-center gap-2 mt-8 md:mt-10">
              Meet the chatbot that closes
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* The WPScanvas Solution */}
      <section id="capabilities" className="bg-[#fcfaf8] border-t border-[#dbd9d7]">
        <div className="u-container py-16 md:py-24 lg:py-28">
          <h2 className="text-section-label mb-4">
            Not a chatbot. A{" "}
            <span className="text-[#d97759]">sales agent</span> that never clocks out
          </h2>
          <p className="font-sans-ui text-base md:text-[0.9375rem] leading-relaxed text-[#3d3d3a] max-w-2xl mb-10 md:mb-14">
            Generic chatbots answer FAQs. Our AI qualifies leads, handles objections, and books
            meetings — 24/7, in natural conversation, trained on your actual business. Three
            capabilities set it apart from everything else on the market.
          </p>
          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {capabilities.map((cap) => (
              <article key={cap.title} className="card-manilla flex flex-col p-6 md:p-8">
                <h4 className="font-sans-ui text-xl md:text-[1.25rem] font-semibold leading-tight text-[#141413] mb-3">
                  {cap.title}
                </h4>
                <p className="font-sans-ui text-sm md:text-[0.875rem] leading-relaxed text-[#3d3d3a] flex-1">
                  {cap.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Service Deep-Dives */}
      <section className="bg-[#fcfaf8] border-t border-[#dbd9d7]">
        <div className="u-container py-16 md:py-24 lg:py-28">
          <h2 className="text-section-label mb-10 md:mb-14">How It Works</h2>
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
          <h2 className="text-section-label mb-4">The 7 Core Capabilities</h2>
          <p className="font-sans-ui text-sm md:text-[0.875rem] leading-relaxed text-[#6b6b6b] max-w-xl mb-10 md:mb-14">
            Every AI chatbot deployment includes these seven capabilities as standard — no
            add-ons, no per-feature pricing.
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
            Get your AI chatbot
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  )
}
