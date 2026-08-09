import type { Metadata } from 'next'
import ProductLanding from '@/components/ProductLanding'
export const metadata: Metadata = { title: 'Review Generation — WPScanvas', description: 'Generate more genuine reviews from your best customers.' }
export default function Page() { return <ProductLanding eyebrow="Automated Review Generation" title="More five-star proof." accent="Without the chase." description="Ask every happy customer at exactly the right moment—automatically—so your reputation keeps earning the next booking." outcome="Make the quality of your service impossible to miss." steps={["Detect happy customers", "Send the simple ask", "Grow trusted local proof"]} cta="Grow your reviews" /> }
