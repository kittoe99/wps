import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import BrandMark from '@/components/BrandMark'

export default function Footer() {
  return <footer className="growth-footer"><div className="growth-shell">
    <div className="growth-footer-top"><div><Link href="/" className="growth-brand"><BrandMark className="growth-brand-mark" /><span>WPS</span>canvas</Link><p>More qualified leads. More booked jobs. Less chasing.</p></div><Link href="/contact" className="growth-button growth-button-dark">Get more appointments <ArrowUpRight size={17} /></Link></div>
    <div className="growth-footer-links"><div><p>Products</p><Link href="/websites">AI Website Builder</Link><Link href="/ai-phone-agent">AI Phone Agents</Link><Link href="/contact">Google Ads Agent</Link><Link href="/reviews-generator">Review Generation</Link></div><div><p>Explore</p><Link href="/">Our system</Link><Link href="/contact">How it works</Link><Link href="/contact">Contact</Link></div><div><p>Contact</p><a href="mailto:hello@wpscanvas.com">hello@wpscanvas.com</a><span>Built for ambitious local businesses.</span></div></div>
    <div className="growth-footer-bottom"><span>© {new Date().getFullYear()} WPScanvas</span><span>More booked jobs, by design.</span></div>
  </div></footer>
}
