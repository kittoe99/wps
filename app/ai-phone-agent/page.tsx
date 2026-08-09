import type { Metadata } from 'next'
import ProductLanding from '@/components/ProductLanding'
export const metadata: Metadata = { title: 'AI Phone Agents — WPScanvas', description: 'Answer every call and book more jobs automatically.' }
export default function Page() { return <ProductLanding eyebrow="AI Phone Agents" title="Every call answered." accent="Every job captured." description="Your AI phone agent responds around the clock, understands what callers need, and gets qualified appointments onto your calendar." outcome="Stop losing high-intent customers to voicemail." steps={["Answer instantly", "Qualify the job", "Book the appointment"]} cta="Put calls on autopilot" /> }
