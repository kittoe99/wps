import type { Metadata } from 'next'
import ProductLanding from '@/components/ProductLanding'
export const metadata: Metadata = { title: 'AI Website Builder — WPScanvas', description: 'Websites designed to generate and convert local demand.' }
export default function Page() { return <ProductLanding eyebrow="AI Website Builder" title="A website built to" accent="fill your calendar." description="A clear, fast website engineered to turn local searchers into leads—and route each opportunity to the next best action." outcome="Your website should be your hardest-working salesperson." steps={["Get found locally", "Build instant trust", "Turn interest into action"]} cta="Build my growth site" /> }
