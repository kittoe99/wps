import Link from "next/link"
import type { Metadata } from "next"
import { contact } from "@/lib/site-content"

export const metadata: Metadata = {
  title: "Contact — wpscanvas",
  description: "Get in touch. Send us a message or start a live chat — we respond fast.",
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f9f6f1]">
      {/* Hero */}
      <section className="bg-[#f9f6f1] border-b border-[#cccbc8]">
        <div className="u-container pt-14 md:pt-20 lg:pt-24 pb-10 md:pb-14">
          <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-8 lg:gap-14 xl:gap-20 items-start">
            <h1 className="text-hero-sans max-w-3xl">
              Let&apos;s build{" "}
              <span className="hero-underline">something</span> together
            </h1>
            <p className="font-sans-ui text-base md:text-[0.9375rem] leading-relaxed text-[#3d3d3a] lg:pt-6 xl:pt-10 max-w-md lg:max-w-none">
              {contact.headline}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Options */}
      <section className="bg-[#f9f6f1]">
        <div className="u-container py-16 md:py-24 lg:py-28">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10">
            {/* Send a Message */}
            <div>
              <h2 className="text-section-label mb-2">Send a message</h2>
              <p className="font-sans-ui text-sm text-[#6b6b6b] mb-8">
                Fill out the form and we&apos;ll get back to you within a few hours — usually faster.
              </p>
              <form
                action={`mailto:${contact.email}`}
                method="POST"
                encType="text/plain"
                className="space-y-5"
              >
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="block font-sans-ui text-sm font-medium text-[#141413] mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="w-full rounded-xl border border-[#cccbc8] bg-white px-4 py-3 font-sans-ui text-sm text-[#141413] placeholder:text-[#b0aea5] focus:border-[#141413] focus:ring-1 focus:ring-[#141413] focus:outline-none transition-all"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block font-sans-ui text-sm font-medium text-[#141413] mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full rounded-xl border border-[#cccbc8] bg-white px-4 py-3 font-sans-ui text-sm text-[#141413] placeholder:text-[#b0aea5] focus:border-[#141413] focus:ring-1 focus:ring-[#141413] focus:outline-none transition-all"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="block font-sans-ui text-sm font-medium text-[#141413] mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    className="w-full rounded-xl border border-[#cccbc8] bg-white px-4 py-3 font-sans-ui text-sm text-[#141413] placeholder:text-[#b0aea5] focus:border-[#141413] focus:ring-1 focus:ring-[#141413] focus:outline-none transition-all"
                    placeholder="What's this about?"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block font-sans-ui text-sm font-medium text-[#141413] mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    className="w-full rounded-xl border border-[#cccbc8] bg-white px-4 py-3 font-sans-ui text-sm text-[#141413] placeholder:text-[#b0aea5] focus:border-[#141413] focus:ring-1 focus:ring-[#141413] focus:outline-none transition-all resize-y"
                    placeholder="Tell us about your project, your questions, or just say hi."
                  />
                </div>
                <button type="submit" className="btn-pill-dark">
                  Send message
                  <span aria-hidden="true">→</span>
                </button>
              </form>
            </div>

            {/* Chat + Email */}
            <div className="flex flex-col gap-8">
              {/* Start a Chat */}
              <div className="card-manilla p-6 md:p-8 rounded-2xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d97759]/10 mb-5">
                  <svg className="w-6 h-6 text-[#d97759]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                </div>
                <h3 className="font-sans-ui text-lg md:text-xl font-semibold text-[#141413] mb-2">
                  Start a chat
                </h3>
                <p className="font-sans-ui text-sm text-[#3d3d3a] leading-relaxed mb-5">
                  Get instant answers from our AI. It&apos;s trained on everything we do — pricing, process, timelines, and FAQs. Available 24/7, responds in seconds.
                </p>
                <Link href="/ai-chatbot" className="btn-pill-outline">
                  Talk to our AI
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              {/* Email */}
              <div className="border border-[#cccbc8] rounded-2xl p-6 md:p-8 bg-white">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d97759]/10 mb-5">
                  <svg className="w-6 h-6 text-[#d97759]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <h3 className="font-sans-ui text-lg md:text-xl font-semibold text-[#141413] mb-2">
                  Send an email
                </h3>
                <p className="font-sans-ui text-sm text-[#3d3d3a] leading-relaxed mb-5">
                  Prefer email? Write us directly. We read every message and typically reply within a few hours.
                </p>
                <a
                  href={`mailto:${contact.email}`}
                  className="font-sans-ui text-[#d97759] hover:text-[#c46a4f] font-medium transition-colors"
                >
                  {contact.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ quick-links */}
      <section className="bg-[#f9f6f1] border-t border-[#cccbc8]">
        <div className="u-container py-16 md:py-24 lg:py-28">
          <h2 className="text-section-label mb-10 md:mb-14">Common questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                q: "How fast can you build my website?",
                a: "Most projects launch within 2-3 weeks from kickoff. Simple sites can go live in under a week. We move fast without cutting corners.",
              },
              {
                q: "Do I need to know anything technical?",
                a: "No. You focus on your business — we handle hosting, updates, security, and content changes. All you need is a browser.",
              },
              {
                q: "Is there a setup fee or contract?",
                a: "Neither. One flat monthly fee, no setup costs, no long-term contracts. Cancel anytime with 30 days' notice. No questions asked.",
              },
              {
                q: "Can the AI chatbot really answer my customers' questions?",
                a: "Yes. We train it on your business — your services, pricing, policies, and FAQ. It handles product questions, books appointments, and qualifies leads 24/7. If it doesn't know something, it escalates to you with full context.",
              },
              {
                q: "What if I already have a website?",
                a: "We can rebuild it, migrate it, or enhance it. If you like your current site but want AI features, we can integrate our chatbot, reviews system, and phone agent into your existing setup.",
              },
              {
                q: "How do the Google reviews work — are they real?",
                a: "100% real. We don't generate fake reviews. Our system identifies your happy customers at the right moment and makes it effortless for them to leave a review — one tap from an SMS or email, straight to your Google profile.",
              },
            ].map((item) => (
              <div key={item.q}>
                <h3 className="font-sans-ui text-base font-semibold text-[#141413] mb-2">
                  {item.q}
                </h3>
                <p className="font-sans-ui text-sm text-[#3d3d3a] leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
