import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reviews Generator — wpscanvas",
  description:
    "Automated Google reviews from real customers. We make it frictionless for happy clients to leave reviews — no fake reviews, no shortcuts, just volume.",
}

const capabilities = [
  {
    title: "Real Reviews From Real Customers",
    description:
      "We don't buy reviews. We don't use bots. Every review on your Google profile comes from an actual customer who used your service. Our system identifies the right moment — right after a completed transaction, a successful service call, or a positive chatbot interaction — and sends a simple, one-tap review request. The reviews are authentic because the experiences are authentic. We just make sure the ask happens at the right time.",
  },
  {
    title: "Frictionless Review Collection",
    description:
      "The number one reason customers don't leave reviews? It's a hassle. They need to open Google, find your business, log in, write something, and submit. Most people abandon the process halfway through. Our system reduces this to a single tap — a personalized SMS or email link that lands them directly on your Google review form, pre-filled with context about their transaction. No logins. No searching. Just a star rating and a few words.",
  },
  {
    title: "Smart Timing & Segmentation",
    description:
      "Asking every customer for a review is a mistake — some interactions aren't review-worthy, and a poorly-timed request can backfire. Our engine analyzes transaction data and customer sentiment to determine the optimal moment to ask. A customer who just had a long, positive chatbot conversation? Ask immediately. A customer who filed a support ticket? Wait until it's resolved. We also segment by service type, letting you prioritize reviews for specific offerings.",
  },
]

const services = [
  {
    title: "Automated Review Requests",
    body: "The system integrates with your CRM, booking platform, or point-of-sale to detect completed transactions in real-time. When a customer's experience hits a positive signal — a completed appointment, a closed support ticket, a high-satisfaction chatbot interaction — the system triggers a personalized review request via SMS or email. Each request includes a one-tap link to your Google review form. Customers don't need to search for your business, remember their login, or figure out how the review platform works. They tap, rate, and move on with their day. The average completion time is under 30 seconds, and our clients see response rates 3-5x higher than manual follow-up campaigns.",
  },
  {
    title: "Multi-Platform Review Syndication",
    body: "Google is the heavyweight, but it's not the only platform that matters. We support review collection for Google, Facebook, Yelp, Trustpilot, and industry-specific directories relevant to your business. You choose which platforms to prioritize, and we route review requests accordingly. A single customer interaction can generate reviews on multiple platforms if that's your strategy, or we can focus on one platform to build density where it matters most. Every review is tracked in a central dashboard so you can see your star rating, volume trends, and sentiment across every channel at a glance.",
  },
  {
    title: "Negative Feedback Filtration",
    body: "Not every customer interaction ends perfectly, and a public complaint can undo months of reputation building. Our system includes a feedback filter — before a review goes public, we route dissatisfied customers to a private feedback form instead of your public Google profile. This gives your team a chance to resolve the issue before it becomes a permanent mark on your reputation. It also gives you valuable operational intelligence: which services generate complaints, which staff members need coaching, and which policies are frustrating customers. The goal isn't to hide bad experiences; it's to fix them before they become public.",
  },
  {
    title: "Review Response Automation",
    body: "Responding to every review manually is impossible at scale. Our AI drafts personalized responses to each review — thanking positive reviewers by name, referencing their specific feedback, and inviting them back. For negative reviews that do make it through the filter, the system crafts a professional, empathetic response that acknowledges the issue and offers a path to resolution. You review and approve each response before it posts, or set rules to auto-publish for clearly positive reviews. Either way, your profile stays active, engaged, and responsive without consuming hours of your week.",
  },
  {
    title: "Reputation Analytics & Reporting",
    body: "Reviews are a data asset, not just a vanity metric. Our dashboard tracks your average rating, review velocity, sentiment trends, and keyword frequency — showing you exactly what customers are saying about your business and how that's changing over time. We benchmark your performance against competitors in your local market, identify your reputation strengths and weaknesses, and recommend operational changes that will directly improve your review scores. Monthly reports go to your inbox with clear, actionable insights — not just charts, but a playbook for getting better.",
  },
]

const features = [
  {
    label: "One-Tap Review Links",
    detail:
      "Personalized SMS and email links that drop customers directly onto your Google review form. No searching, no logins, no friction — just tap, rate, done.",
  },
  {
    label: "Smart Timing Engine",
    detail:
      "Reviews are requested at the moment of peak satisfaction — right after a completed service, not days later when the experience has faded from memory.",
  },
  {
    label: "Negative Feedback Filtration",
    detail:
      "Unhappy customers are routed to a private feedback form first, giving your team a chance to resolve issues before they become public complaints.",
  },
  {
    label: "Multi-Platform Support",
    detail:
      "Collect reviews on Google, Facebook, Yelp, Trustpilot, and industry-specific directories — all managed from a single dashboard with unified reporting.",
  },
  {
    label: "AI-Powered Review Responses",
    detail:
      "Every review gets a personalized, context-aware response drafted by AI. You approve before it posts, or set auto-publish rules for positive reviews.",
  },
  {
    label: "Competitor Benchmarking",
    detail:
      "See how your ratings, volume, and sentiment compare to competitors in your local market — and get specific recommendations for closing the gap.",
  },
  {
    label: "Full Compliance & Authenticity",
    detail:
      "Every review is from a verified real customer. We comply with Google's review policies and FTC guidelines. No fake reviews, no shortcuts, no risk.",
  },
]

export default function ReviewsGeneratorPage() {
  return (
    <main className="min-h-screen bg-[#fcfaf8]">
      {/* Hero — The Problem */}
      <section className="bg-[#fcfaf8] border-b border-[#dbd9d7]">
        <div className="u-container pt-14 md:pt-20 lg:pt-24 pb-10 md:pb-14">
          <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-8 lg:gap-14 xl:gap-20 items-start">
            <h1 className="text-hero-sans max-w-3xl">
              Your best customers love you.{" "}
              <span className="hero-underline">They just don't leave reviews</span>
            </h1>
            <p className="font-sans-ui text-base md:text-[0.9375rem] leading-relaxed text-[#3d3d3a] lg:pt-6 xl:pt-10 max-w-md lg:max-w-none">
              The average business serves hundreds of satisfied customers every month. But fewer than 5% ever leave a review — not because they're unhappy, but because the process is inconvenient. Meanwhile, a competitor with 50 reviews and a 4.8 rating is stealing your traffic, even if your service is better. The problem isn't your quality. It's your ask.
            </p>
          </div>
        </div>
      </section>

      {/* The Gap */}
      <section className="bg-[#fcfaf8]">
        <div className="u-container py-12 md:py-16">
          <div className="card-hero-dark px-8 md:px-12 lg:px-16 py-12 md:py-16 lg:py-20">
            <h2>Manual follow-ups don't scale. Fake reviews destroy trust. There's a third path.</h2>
            <p className="mt-5 md:mt-6">
              Some businesses buy reviews and live in fear of Google's algorithm. Others send awkward email blasts that get ignored. The smartest businesses automate the ask — reaching real customers at the right moment, with zero friction, and zero ethical compromise. That's what we built. Real reviews, real volume, real results.
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
            Real reviews,{" "}
            <span className="text-[#d97759]">automated</span> — not fake reviews, automated
          </h2>
          <p className="font-sans-ui text-base md:text-[0.9375rem] leading-relaxed text-[#3d3d3a] max-w-2xl mb-10 md:mb-14">
            There's a massive difference between generating fake reviews and making it
            effortless for real customers to share their genuine experiences. Our system does the
            latter — and it does it at scale. Three principles guide everything we build.
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
            Every review generator deployment includes these seven capabilities as standard — no
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
            Start collecting real reviews
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  )
}
