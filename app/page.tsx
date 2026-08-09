import Link from "next/link"
import type { Metadata } from "next"
import { ArrowUpRight, CalendarCheck, Globe2, Megaphone, PhoneCall, Search, Star } from "lucide-react"

export const metadata: Metadata = {
  title: "More booked jobs. Less chasing. — WPScanvas",
  description:
    "WPScanvas turns clicks, calls, and reviews into booked appointments for local service businesses.",
}

const products = [
  {
    icon: Globe2,
    title: "AI Website Builder",
    copy: "A website built to turn local searches into calls and booked jobs.",
    href: "/websites",
  },
  {
    icon: PhoneCall,
    title: "AI Phone Agents",
    copy: "Answer every call, qualify the job, and book it while you work.",
    href: "/ai-phone-agent",
  },
  {
    icon: Megaphone,
    title: "Google Ads Agent",
    copy: "Keep demand coming with campaigns built around your best jobs.",
    href: "/contact",
  },
  {
    icon: Star,
    title: "Review Generation",
    copy: "Turn great service into the reviews that win the next customer.",
    href: "/reviews-generator",
  },
]

export default function HomePage() {
  return (
    <main className="growth-page">
      <section className="growth-hero">
        <div className="growth-orb growth-orb-one" aria-hidden="true" />
        <div className="growth-orb growth-orb-two" aria-hidden="true" />
        <div className="growth-shell growth-hero-inner">
          <div className="growth-hero-copy">
            <p className="growth-kicker"><span /> Built for local businesses ready to grow</p>
            <h1>More booked jobs.<br /><em>On autopilot.</em></h1>
            <p className="growth-lede">
              WPScanvas puts your lead generation, call handling, and follow-up on one intelligent system—so more inquiries become appointments.
            </p>
            <div className="growth-actions">
              <Link href="/contact" className="growth-button growth-button-dark">Get more appointments <ArrowUpRight size={17} /></Link>
              <Link href="#products" className="growth-text-link">Explore the system <span>↓</span></Link>
            </div>
            <p className="growth-note">For home services, clinics, local pros, and ambitious small businesses.</p>
          </div>

          <div className="growth-console" aria-label="Illustration of the WPScanvas appointment engine">
            <div className="growth-console-top"><span className="growth-live-dot" /> APPOINTMENT ENGINE <span>LIVE</span></div>
            <div className="growth-console-main">
              <div className="growth-console-label">This week</div>
              <div className="growth-console-metric">New jobs, handled.</div>
              <div className="growth-stream">
                <div className="growth-stream-card"><i className="growth-icon"><Globe2 size={15} /></i><div><b>Website lead</b><small>Estimate requested</small></div><strong>Qualified</strong></div>
                <div className="growth-stream-card"><i className="growth-icon"><Search size={15} /></i><div><b>Google Ads lead</b><small>Plumbing service</small></div><strong>Booked</strong></div>
                <div className="growth-stream-card"><i className="growth-icon"><PhoneCall size={15} /></i><div><b>Phone call</b><small>Emergency repair</small></div><strong>Booked</strong></div>
              </div>
              <div className="growth-console-footer"><span>Response time</span><b>Instant</b><span>Follow-up</span><b>Automatic</b></div>
            </div>
          </div>
        </div>
      </section>

      <section className="growth-intro">
        <div className="growth-shell">
          <p className="growth-kicker">Growth doesn&apos;t need more tools</p>
          <h2>It needs one system that never lets a good lead go cold.</h2>
          <div className="growth-intro-grid">
            <p>Marketing brings in attention. WPScanvas turns it into the calls, conversations, and appointments that move your business forward.</p>
            <Link href="/contact" className="growth-text-link">Build your growth engine <span>↗</span></Link>
          </div>
        </div>
      </section>

      <section id="products" className="growth-products">
        <div className="growth-shell">
          <div className="growth-section-head"><p className="growth-kicker">One connected growth engine</p><p>Every part works toward the same outcome: a fuller calendar.</p></div>
          <div className="growth-product-grid">
            {products.map((product) => (
              <Link href={product.href} key={product.title} className="growth-product-card">
                <span className="growth-product-icon"><product.icon size={22} strokeWidth={1.5} /></span>
                <div><h3>{product.title}</h3><p>{product.copy}</p></div>
                <span className="growth-product-arrow">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="growth-outcome">
        <div className="growth-shell growth-outcome-grid">
          <div><p className="growth-kicker">Designed to convert</p><h2>Be the business that answers first.</h2></div>
          <div className="growth-outcome-list">
            <p><span><Search size={17} /></span> Get found when buyers are looking.</p>
            <p><span><PhoneCall size={17} /></span> Respond while intent is highest.</p>
            <p><span><CalendarCheck size={17} /></span> Book the appointment without the back-and-forth.</p>
          </div>
        </div>
      </section>

      <section className="growth-cta">
        <div className="growth-shell">
          <div className="growth-cta-panel">
            <p className="growth-kicker">Your next customer is already searching</p>
            <h2>Let&apos;s put your appointments on autopilot.</h2>
            <Link href="/contact" className="growth-button growth-button-light">Talk to WPScanvas <span>↗</span></Link>
          </div>
        </div>
      </section>
    </main>
  )
}
