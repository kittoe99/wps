import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Phone Agent — wpscanvas",
  description:
    "An AI that answers your business line, books appointments, and never misses a call — 24/7, with full transcripts delivered via SMS or email.",
}

const capabilities = [
  {
    title: "Answers Every Call, Every Time",
    description:
      "Not a voicemail box. Not a generic IVR tree. Our AI answers live, understands natural language, and responds with your business's tone, policies, and personality. It handles the caller's request end-to-end — from answering questions about pricing and availability to booking an appointment — without ever putting someone on hold or asking them to \"press 1 for sales.\"",
  },
  {
    title: "Books Appointments While You Sleep",
    description:
      "The agent syncs with your calendar in real-time. When a caller wants to book, it checks availability, finds the right slot, confirms the booking, and sends both parties a confirmation. No double-booking. No manual entry. Just a filled calendar and a satisfied customer who didn't have to wait until Monday morning for a callback.",
  },
  {
    title: "Intelligence That Grows Every Week",
    description:
      "Every call is transcribed, analyzed, and tagged. We surface patterns — common objections, frequently asked questions, peak call times — and use that data to retrain the agent monthly. If a new product launches or pricing changes, we update the knowledge base and the agent adapts within hours. The system gets smarter the longer it runs, not more stale.",
  },
]

const services = [
  {
    title: "24/7 Inbound Call Handling",
    body: "Your business line is answered by a conversational AI trained on your specific business — your hours, your services, your pricing, your FAQ. It doesn't follow a rigid script. It understands context, asks clarifying questions when it needs to, and handles the vast majority of calls to completion. When a situation genuinely requires human judgment — a complex negotiation, an escalated complaint — it transfers the call with a full summary of what's already been discussed, so the caller never repeats themselves. Callers don't know they're talking to AI, and they don't care — they just know their problem got solved.",
  },
  {
    title: "Intelligent Appointment Scheduling",
    body: "Calendar integration isn't an afterthought — it's the backbone. Our agent connects directly to Google Calendar, Office 365, or any CalDAV-compatible system. During a call, it reads your live availability, proposes time slots, handles rescheduling requests, and confirms bookings in seconds. It understands time zones, buffer preferences, and booking rules (e.g., \"never book two services back-to-back\"). Every confirmation triggers an SMS and email to both you and the customer. Cancellations and no-shows are handled with automatic follow-up calls to rebook.",
  },
  {
    title: "Call Intelligence & Analytics",
    body: "Every conversation is transcribed word-for-word, not summarized by a human operator who only captured half the details. We categorize calls by intent — new inquiry, booking, support, pricing question, complaint — and build a real-time dashboard that shows you exactly what your customers are asking about. You'll see call volume trends, conversion rates, average handle time, and common failure points where the AI needs improvement. This isn't just call logging; it's market intelligence delivered straight to your inbox every week.",
  },
  {
    title: "Seamless Human Handoff",
    body: "AI is powerful, but it knows its limits. When a call exceeds the agent's confidence threshold — a complex legal question, an emotional situation, a VIP client who should always get a human — it transfers immediately with full context. The receiving person gets a dashboard notification or SMS with the caller's name, a summary of the conversation so far, and the reason for escalation. There's no \"Can you explain that again?\" — the handoff is seamless. You define the escalation rules; the agent follows them 100% of the time.",
  },
  {
    title: "Ongoing Training & Optimization",
    body: "Launching the agent is the starting line, not the finish line. We review call transcripts monthly, identify edge cases where the agent stumbled, and retrain the model to handle those scenarios. We also monitor for changes in your business — new services, updated hours, seasonal promotions — and push knowledge base updates within a day. Every quarter, we deliver a performance report showing call volume, resolution rate, revenue attributed to phone bookings, and a roadmap of improvements. Your phone line gets better, not older.",
  },
]

const features = [
  {
    label: "Natural Language Understanding",
    detail:
      "Callers speak naturally. The agent understands accents, industry jargon, and conversational nuance without any menu tree or keypad.",
  },
  {
    label: "Live Calendar Sync",
    detail:
      "Real-time integration with Google Calendar, Office 365, and CalDAV. Availability is always up-to-date, and double-bookings are impossible.",
  },
  {
    label: "Full Call Transcripts",
    detail:
      "Every call is transcribed, searchable, and archived. You can review any conversation, find patterns, and use transcripts for training or compliance.",
  },
  {
    label: "SMS & Email Notifications",
    detail:
      "Instant alerts for every booking, missed call, or escalation. Customize which events trigger notifications and who on your team receives them.",
  },
  {
    label: "Custom Voice & Persona",
    detail:
      "The agent's voice, tone, and conversational style are trained to match your brand. Warm and casual for a salon. Professional and precise for a law firm.",
  },
  {
    label: "Multi-Location Routing",
    detail:
      "Operate multiple locations? The agent routes calls based on the caller's location, the service they need, or custom rules you define. One phone number, infinite flexibility.",
  },
  {
    label: "Enterprise-Grade Reliability",
    detail:
      "Redundant infrastructure, 99.9% uptime SLA, encrypted call streams, and SOC 2 compliance. Your calls are secure, private, and always available.",
  },
]

export default function AiPhoneAgentPage() {
  return (
    <main className="min-h-screen bg-[#fcfaf8]">
      {/* Hero — The Problem */}
      <section className="bg-[#fcfaf8] border-b border-[#dbd9d7]">
        <div className="u-container pt-14 md:pt-20 lg:pt-24 pb-10 md:pb-14">
          <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-8 lg:gap-14 xl:gap-20 items-start">
            <h1 className="text-hero-sans max-w-3xl">
              Every missed call is a{" "}
              <span className="hero-underline">missed customer</span>
            </h1>
            <p className="font-sans-ui text-base md:text-[0.9375rem] leading-relaxed text-[#3d3d3a] lg:pt-6 xl:pt-10 max-w-md lg:max-w-none">
              Studies show 62% of business calls go to voicemail. Of those, fewer than 5% leave a message. The ones who do wait hours — sometimes days — for a callback, by which point they&apos;ve already called your competitor. The phone isn&apos;t dying. It&apos;s being neglected — and it&apos;s costing you more than you think.
            </p>
          </div>
        </div>
      </section>

      {/* The Gap */}
      <section className="bg-[#fcfaf8]">
        <div className="u-container py-12 md:py-16">
          <div className="card-hero-dark px-8 md:px-12 lg:px-16 py-12 md:py-16 lg:py-20">
            <h2>Hiring a receptionist doesn&apos;t scale. Letting calls ring out is worse.</h2>
            <p className="mt-5 md:mt-6">
              Front-desk staff call in sick. Answering services route your calls overseas to operators who have never seen your business. VoIP auto-attendants frustrate callers into hanging up. None of these are solutions — they&apos;re compromises dressed up as infrastructure. There&apos;s a better way.
            </p>
            <Link href="#capabilities" className="inline-flex items-center gap-2 mt-8 md:mt-10">
              See how it works
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* The WPScanvas Solution */}
      <section id="capabilities" className="bg-[#fcfaf8] border-t border-[#dbd9d7]">
        <div className="u-container py-16 md:py-24 lg:py-28">
          <h2 className="text-section-label mb-4">
            An AI agent that answers, books, and follows up —{" "}
            <span className="text-[#d97759]">24/7, without a script</span>
          </h2>
          <p className="font-sans-ui text-base md:text-[0.9375rem] leading-relaxed text-[#3d3d3a] max-w-2xl mb-10 md:mb-14">
            Your phone line should be a revenue engine, not a liability. We deploy a custom AI
            phone agent trained on your business — your hours, your pricing, your tone, your
            policies — that handles every call from hello to goodbye. Three core capabilities
            make it work.
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
            Every AI phone agent deployment includes these seven capabilities as standard — no
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
            Get your AI phone agent
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  )
}
