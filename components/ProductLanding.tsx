import Link from 'next/link'
import { ArrowUpRight, CalendarCheck, Check, MessageCircleMore, ShieldCheck, Sparkles } from 'lucide-react'

type ProductLandingProps = { eyebrow: string; title: string; accent: string; description: string; outcome: string; steps: [string, string, string]; cta: string }
const stepIcons = [Sparkles, MessageCircleMore, CalendarCheck]

export default function ProductLanding({ eyebrow, title, accent, description, outcome, steps, cta }: ProductLandingProps) {
  return <main className="growth-page growth-product-page">
    <section className="growth-product-hero"><div className="growth-shell"><p className="growth-kicker"><span /> {eyebrow}</p><div className="growth-product-title"><h1>{title} <em>{accent}</em></h1><p>{description}</p></div><Link href="/contact" className="growth-button growth-button-dark">{cta} <ArrowUpRight size={17} /></Link></div></section>
    <section className="growth-product-outcome"><div className="growth-shell"><p className="growth-kicker">The outcome</p><h2>{outcome}</h2><div className="growth-outcome-signals"><span><Sparkles size={15} /> Always working</span><span><CalendarCheck size={15} /> Built to book</span><span><ShieldCheck size={15} /> Made for your business</span></div></div></section>
    <section className="growth-product-steps"><div className="growth-shell"><p className="growth-kicker">How it works</p><div className="growth-steps-grid">{steps.map((step, index) => { const Icon = stepIcons[index]; return <article key={step}><span className="growth-step-icon"><Icon size={22} strokeWidth={1.5} /></span><h3>{step}</h3><p>{index === 0 ? 'Start with the right signal at the right time.' : index === 1 ? 'Let AI handle the work that normally slows your team down.' : 'Keep the conversation moving until the appointment is on the calendar.'}</p></article> })}</div></div></section>
    <section className="growth-product-details"><div className="growth-shell growth-detail-grid"><div><p className="growth-kicker">Simple by design</p><h2>One less thing for your team to manage.</h2><p>We tailor the system to your business, then keep it running in the background. You stay focused on doing the work customers choose you for.</p></div><div className="growth-check-list"><p><Check size={17} /> Set up around your real customer journey</p><p><Check size={17} /> Clear handoff when a person needs to step in</p><p><Check size={17} /> Built to work alongside your existing tools</p></div></div></section>
    <section className="growth-product-cta"><div className="growth-shell"><p className="growth-kicker">Ready when you are</p><h2>Make every opportunity count.</h2><Link href="/contact" className="growth-button growth-button-light">{cta} <ArrowUpRight size={17} /></Link></div></section>
  </main>
}
