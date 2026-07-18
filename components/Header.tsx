'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [productsExpanded, setProductsExpanded] = useState(true)
  const [productsOpen, setProductsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [canvasOpacity, setCanvasOpacity] = useState(1)

  // Handle scroll to fade out "canvas" text
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      
      // Start fading at 100px, fully hidden at 300px
      const fadeStart = 100
      const fadeEnd = 300
      
      if (scrollY < fadeStart) {
        setCanvasOpacity(1)
      } else if (scrollY >= fadeEnd) {
        setCanvasOpacity(0)
      } else {
        setCanvasOpacity(1 - ((scrollY - fadeStart) / (fadeEnd - fadeStart)))
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className="sticky top-0 border-b border-[#cccbc8] bg-[#f9f6f1]/95 backdrop-blur-sm z-[100]">
      <nav className="u-container relative z-[100]">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0 group" aria-label="WPScanvas Home">
            <svg
              className="w-7 h-7 text-[#d97759] -mr-1.5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-hidden="true"
            >
              {/* Two thick vertical bars tilted left */}
              <rect x="4" y="4" width="5" height="16" rx="1" fill="currentColor" transform="rotate(-15 12 12)" />
              <rect x="10" y="4" width="5" height="16" rx="1" fill="currentColor" transform="rotate(-15 12 12)" />
            </svg>
            <span className="text-lg font-semibold tracking-tight text-neutral-900 group-hover:text-neutral-900 overflow-hidden">
              <span className="inline-block">WPS</span>
              <span 
                className="inline-block transition-all duration-300" 
                style={{ 
                  opacity: canvasOpacity, 
                  maxWidth: canvasOpacity > 0 ? '200px' : '0px' 
                }}
              >
                canvas
              </span>
            </span>
          </Link>
          
          {/* Mobile Search Bar (between logo and menu button) */}
          <div className="flex-1 md:hidden">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
                placeholder="Search..."
                className="h-9 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-300 focus:ring-1 focus:ring-neutral-300 focus:outline-none transition-all"
              />
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {/* Products Dropdown */}
            <div 
              className="relative" 
              onMouseEnter={() => setProductsOpen(true)} 
              onMouseLeave={() => setProductsOpen(false)}
            >
              <button 
                onClick={() => setProductsOpen(!productsOpen)} 
                className="text-sm font-medium text-[#d97759] hover:text-[#c46a4f] transition-colors flex items-center gap-1"
              >
                Products
                <svg className={`w-4 h-4 transition-transform ${productsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {productsOpen && (
                <div className="absolute top-full left-0 pt-2 z-[110]">
                  <div className="w-64 bg-white border border-neutral-300 rounded-xl shadow-2xl py-2">
                  <Link href="/websites" className="flex items-center gap-3 px-4 py-3 hover:bg-[#d97759]/10 rounded-lg mx-2 transition-colors" onClick={() => setProductsOpen(false)}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d97759]/10">
                      <svg className="w-5 h-5 text-[#d97759]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900">Website</div>
                      <div className="text-xs text-neutral-500">Custom sites, hosted & maintained</div>
                    </div>
                  </Link>
                  <Link href="/ai-chatbot" className="flex items-center gap-3 px-4 py-3 hover:bg-[#d97759]/10 rounded-lg mx-2 transition-colors" onClick={() => setProductsOpen(false)}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d97759]/10">
                      <svg className="w-5 h-5 text-[#d97759]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900">AI Chatbot</div>
                      <div className="text-xs text-neutral-500">24/7 lead capture & booking</div>
                    </div>
                  </Link>
                  <Link href="/reviews-generator" className="flex items-center gap-3 px-4 py-3 hover:bg-[#d97759]/10 rounded-lg mx-2 transition-colors" onClick={() => setProductsOpen(false)}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d97759]/10">
                      <svg className="w-5 h-5 text-[#d97759]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900">Reviews Generator</div>
                      <div className="text-xs text-neutral-500">Automated Google reviews</div>
                    </div>
                  </Link>
                  <Link href="/ai-phone-agent" className="flex items-center gap-3 px-4 py-3 hover:bg-[#d97759]/10 rounded-lg mx-2 transition-colors" onClick={() => setProductsOpen(false)}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d97759]/10">
                      <svg className="w-5 h-5 text-[#d97759]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900">AI Phone Answering</div>
                      <div className="text-xs text-neutral-500">Never miss a call again</div>
                    </div>
                  </Link>
                  </div>
                </div>
              )}
            </div>
            <Link 
              href="/#work" 
              className="text-sm font-medium text-[#d97759] hover:text-[#c46a4f] transition-colors"
            >
              Work
            </Link>
            <Link 
              href="/contact" 
              className="text-sm font-medium text-[#d97759] hover:text-[#c46a4f] transition-colors"
            >
              Contact
            </Link>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:block flex-1 max-w-xs">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
                placeholder="Search..."
                className="h-9 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-300 focus:ring-1 focus:ring-neutral-300 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            <Link 
              href="/login"
              className="text-sm font-medium text-[#d97759] hover:text-[#c46a4f] transition-colors"
            >
              Sign in
            </Link>
            <Link 
              href="/contact"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-lg hover:bg-neutral-900/5 transition-all duration-200"
            aria-label="Toggle menu"
          >
            <div className="w-5 h-5 flex flex-col justify-center gap-1">
              <span className={`block h-0.5 bg-neutral-900 rounded-full transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
              <span className={`block h-0.5 bg-neutral-900 rounded-full transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block h-0.5 bg-neutral-900 rounded-full transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#f9f6f1] z-[110] md:hidden border-b border-[#cccbc8]">
          {/* Navigation */}
          <nav className="px-4 py-4 space-y-1 max-h-[70vh] overflow-y-auto">
            {/* Home */}
            <Link 
              href="/"
              className="block px-4 py-3 text-sm font-medium text-neutral-900 hover:bg-white rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            
            {/* Products Section */}
            <div>
              <button 
                onClick={() => setProductsExpanded(!productsExpanded)}
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-neutral-900 hover:bg-white rounded-lg transition-colors"
              >
                <span>Products</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${productsExpanded ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {productsExpanded && (
                <div className="mt-1 ml-2 space-y-1 overflow-hidden">
                  <Link 
                    href="/reviews-generator"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white group transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d97759]/10 flex-shrink-0">
                      <svg className="w-4 h-4 text-[#d97759]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900">Reviews Generator</div>
                      <div className="text-xs text-neutral-500">Automated Google reviews</div>
                    </div>
                  </Link>
                  <Link 
                    href="/ai-chatbot"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white group transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d97759]/10 flex-shrink-0">
                      <svg className="w-4 h-4 text-[#d97759]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900">AI Chatbot</div>
                      <div className="text-xs text-neutral-500">24/7 lead capture & booking</div>
                    </div>
                  </Link>
                  <Link 
                    href="/ai-phone-agent"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white group transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d97759]/10 flex-shrink-0">
                      <svg className="w-4 h-4 text-[#d97759]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900">AI Phone Answering</div>
                      <div className="text-xs text-neutral-500">Never miss a call again</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Other Links */}
            <Link 
              href="/#work"
              className="block px-4 py-3 text-sm font-medium text-neutral-900 hover:bg-white rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Work
            </Link>
            <Link 
              href="/contact"
              className="block px-4 py-3 text-sm font-medium text-neutral-900 hover:bg-white rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
          </nav>

          {/* Footer Actions */}
          <div className="px-4 py-4 border-t border-neutral-200 flex gap-2">
            <Link 
              href="/login"
              className="flex-1 rounded-lg py-2.5 text-center text-sm font-medium text-neutral-900 border border-neutral-300 hover:bg-white transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign in
            </Link>
            <Link 
              href="/contact"
              className="flex-1 rounded-lg py-2.5 text-center text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
