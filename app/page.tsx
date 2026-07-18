import Link from "next/link"
import { contact, hero, portfolio, services } from '@/lib/site-content'

const featuredServices = services.slice(0, 3)
const phoneService = services.find((s) => s.id === "phone")!

function ReleaseCard({
  title,
  description,
  meta,
  href,
  cta,
}: {
  title: string
  description: string
  meta: { label: string; value: string }[]
  href: string
  cta: string
}) {
  return (
    <article className="card-manilla flex flex-col p-6 md:p-8">
      <h4 className="font-serif-editorial text-2xl md:text-[1.75rem] leading-tight text-[#141413] mb-4">
        {title}
      </h4>
      <p className="font-sans-ui text-sm md:text-[0.9375rem] leading-relaxed text-[#3d3d3a] flex-1">
        {description}
      </p>
      <div className="mt-8 border-t border-[#cccbc8]/70">
        {meta.map((item, index) => (
          <div
            key={item.label}
            className={`flex items-start justify-between gap-4 py-3 ${
              index > 0 ? "border-t border-[#cccbc8]/70" : ""
            }`}
          >
            <span className="font-sans-ui text-[0.6875rem] uppercase tracking-[0.06em] text-[#87867f] shrink-0">
              {item.label}
            </span>
            <span className="font-sans-ui text-sm text-[#141413] text-right">{item.value}</span>
          </div>
        ))}
      </div>
      <Link href={href} className="btn-pill-dark mt-8 w-fit">
        {cta}
        <span aria-hidden="true">→</span>
      </Link>
    </article>
  )
}

function ListRow({ title, category, href }: { title: string; category: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-6 py-5 border-b border-[#cccbc8] group"
    >
      <span className="font-sans-ui text-base md:text-lg font-semibold text-[#141413] group-hover:opacity-70 transition-opacity">
        {title}
      </span>
      <span className="font-sans-ui text-sm text-[#b0aea5] text-right shrink-0">{category}</span>
    </Link>
  )
}

export default function Home() {
  const listItems = [
    { title: phoneService.title, category: phoneService.tag, href: "#contact" },
    ...portfolio.map((site) => {
      const [category] = site.desc.split(" — ")
      return { title: site.name, category, href: "#contact" }
    }),
  ]

  return (
    <main className="min-h-screen bg-[#f9f6f1]">
      {/* Hero */}
      <section className="bg-[#f9f6f1]">
        <div className="u-container pt-14 md:pt-20 lg:pt-24 pb-10 md:pb-14">
          <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-8 lg:gap-14 xl:gap-20 items-start">
            <h1 className="text-hero-sans max-w-3xl">
              A{" "}
              <span className="hero-underline">website</span> that runs your{" "}
              <span className="hero-underline">business</span> while you sleep
            </h1>
            <p className="font-serif-editorial text-lg md:text-xl leading-[1.45] text-[#141413] lg:pt-6 xl:pt-10 max-w-md lg:max-w-none">
              {hero.body}
            </p>
          </div>
        </div>

        <div className="u-container pb-14 md:pb-20 lg:pb-24">
          <div className="card-hero-dark px-8 md:px-12 lg:px-16 py-12 md:py-16 lg:py-20">
            <h2>Everything in one subscription.</h2>
            <p className="mt-5 md:mt-6">
              Website, chatbot, Google reviews, and phone answering — one flat monthly fee. No add-ons. No per-feature pricing.
            </p>
            <Link href="#services" className="inline-flex items-center gap-2 mt-8 md:mt-10">
              See what&apos;s included
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* What's included — Anthropic Latest releases cards */}
      <section id="services" className="bg-[#f9f6f1]">
        <div className="u-container py-16 md:py-24 lg:py-28">
          <h2 className="text-section-label mb-10 md:mb-14">What&apos;s included</h2>
          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {featuredServices.map((service) => (
              <ReleaseCard
                key={service.id}
                title={service.title}
                description={service.desc}
                meta={[
                  { label: "Category", value: service.tag },
                  { label: "Features", value: service.points.join(", ") },
                ]}
                href="/contact"
                cta="Learn more"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Statement + link list — Anthropic bottom split */}
      <section id="work" className="bg-[#f9f6f1] border-t border-[#cccbc8]">
        <div className="u-container py-16 md:py-24 lg:py-28">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-12 lg:gap-20 items-start">
            <h2 className="font-sans-ui text-2xl md:text-3xl lg:text-[2rem] font-bold leading-[1.2] tracking-tight text-[#141413] max-w-md">
              {contact.headline}
            </h2>

            <div>
              {listItems.map((item) => (
                <ListRow key={item.title} title={item.title} category={item.category} href={item.href} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-[#f9f6f1] border-t border-[#cccbc8]">
        <div className="u-container py-12 md:py-16">
          <a href={`mailto:${contact.email}`} className="btn-pill-dark">
            {contact.email}
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>
    </main>
  )
}
