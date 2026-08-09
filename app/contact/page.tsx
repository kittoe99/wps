import type { Metadata } from 'next'
import ContactForm from '@/components/ContactForm'

export const metadata: Metadata = { title: 'Get more appointments — WPScanvas', description: 'Talk to WPScanvas about putting your lead generation and booking on autopilot.' }

export default function ContactPage() {
  return <main className="growth-page growth-contact-page"><section className="growth-contact-hero"><div className="growth-shell"><p className="growth-kicker"><span /> Start a better growth system</p><h1>Let&apos;s get your calendar <em>working harder.</em></h1><p>Tell us where leads fall through today. We&apos;ll show you the fastest path to more calls and booked appointments.</p></div></section><section className="growth-contact-form"><div className="growth-shell growth-contact-grid"><div><p className="growth-kicker">No pressure. Just clarity.</p><h2>More demand is great. Converting it is better.</h2><p>We build simple AI-powered systems that help local businesses attract, answer, and book more customers.</p><a href="mailto:hello@wpscanvas.com" className="growth-text-link">hello@wpscanvas.com <span>↗</span></a></div><ContactForm /></div></section></main>
}
