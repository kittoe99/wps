import Header from "@/components/Header"
import Footer from "@/components/Footer"

/** Marketing chrome (nav + footer). */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}