'use client'

import Link from 'next/link'
import { ArrowDown, ArrowUpRight, ChevronDown, Globe2, Megaphone, Menu, PhoneCall, Star, X } from 'lucide-react'
import { useState } from 'react'
import BrandMark from '@/components/BrandMark'

const products = [
  ['AI Website Builder', 'Turn local searches into booked jobs.', '/websites', Globe2],
  ['AI Phone Agents', 'Answer, qualify, and book every call.', '/ai-phone-agent', PhoneCall],
  ['Google Ads Agent', 'Keep qualified demand coming in.', '/contact', Megaphone],
  ['Review Generation', 'Turn happy customers into proof.', '/reviews-generator', Star],
] as const

export default function Header() {
  const [open, setOpen] = useState(false)
  return <header className="growth-nav">
    <nav className="growth-shell growth-nav-inner" aria-label="Main navigation">
      <Link href="/" className="growth-brand" aria-label="WPScanvas home"><BrandMark className="growth-brand-mark" /><span>WPS</span>canvas</Link>
      <div className="growth-nav-links"><div className="growth-nav-products"><button type="button" onClick={() => setOpen(!open)} aria-expanded={open}>Products <ChevronDown size={14} className={open ? 'growth-chevron-open' : ''} /></button>{open && <div className="growth-nav-menu">{products.map(([label, detail, href, Icon]) => <Link href={href} key={label} onClick={() => setOpen(false)}><small><Icon size={16} strokeWidth={1.6} /></small><span><b>{label}</b><i>{detail}</i></span><em><ArrowUpRight size={15} /></em></Link>)}</div>}</div><Link href="/contact">How it works</Link><Link href="/contact">Contact</Link></div>
      <div className="growth-nav-action"><Link href="/login" className="growth-login">Log in</Link><Link href="/contact" className="growth-nav-cta">Get more appointments <ArrowUpRight size={15} /></Link></div>
      <button type="button" className="growth-menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X size={19} /> : <Menu size={19} />}</button>
    </nav>
    {open && <div className="growth-mobile-layer"><div className="growth-mobile-menu growth-shell"><p className="growth-kicker">The WPScanvas system</p>{products.map(([label, detail, href, Icon]) => <Link href={href} key={label} onClick={() => setOpen(false)}><span className="growth-mobile-product"><i><Icon size={17} /></i><span><b>{label}</b><small>{detail}</small></span></span><ArrowUpRight size={16} /></Link>)}<div className="growth-mobile-secondary"><Link href="/contact" onClick={() => setOpen(false)}>How it works <ArrowDown size={14} /></Link><Link href="/contact" onClick={() => setOpen(false)}>Contact <ArrowUpRight size={14} /></Link></div><Link href="/contact" className="growth-mobile-cta" onClick={() => setOpen(false)}>Get more appointments <ArrowUpRight size={16} /></Link></div></div>}
  </header>
}
