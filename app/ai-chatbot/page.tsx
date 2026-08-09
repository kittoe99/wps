import type { Metadata } from 'next'
import ProductLanding from '@/components/ProductLanding'
export const metadata: Metadata = { title: 'AI Lead Agent — WPScanvas', description: 'Turn website visitors into booked appointments.' }
export default function Page() { return <ProductLanding eyebrow="AI Lead Agent" title="Turn questions into" accent="booked conversations." description="An AI agent that handles the first conversation, gives buyers the answers they need, and hands you warm, qualified leads." outcome="Your website should keep selling after you clock out." steps={["Engage visitors", "Answer with context", "Capture and route leads"]} cta="Capture more leads" /> }
