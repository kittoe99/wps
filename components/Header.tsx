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
    <header className="sticky top-0 border-b border-neutral-200 bg-[#f9f8f6] backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.04)] z-[100]">
      <nav className="max-w-5xl mx-auto px-6 lg:px-8 relative z-[100]">
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
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-neutral-300 rounded-xl shadow-2xl py-2 z-[110]">
                  <Link href="/website" className="flex items-center gap-3 px-4 py-3 hover:bg-[#d97759]/10 rounded-lg mx-2 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d97759]/10">
                      <svg className="w-5 h-5 text-[#d97759]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900">Website</div>
                      <div className="text-xs text-neutral-500">Professional sites</div>
                    </div>
                  </Link>
                  <Link href="/canvas-printing" className="flex items-center gap-3 px-4 py-3 hover:bg-[#d97759]/10 rounded-lg mx-2 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d97759]/10">
                      <svg className="w-5 h-5 text-[#d97759]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900">Canvas Printing</div>
                      <div className="text-xs text-neutral-500">Print your art</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
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
              href="/dashboard"
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
        <div className="absolute top-full left-0 right-0 bg-[#f9f8f6] z-[110] md:hidden border-b border-neutral-200">
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
                    href="/website"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white group transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d97759]/10 flex-shrink-0">
                      <svg className="w-4 h-4 text-[#d97759]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900">Website</div>
                      <div className="text-xs text-neutral-500">Professional sites</div>
                    </div>
                  </Link>
                  <Link 
                    href="/canvas-printing"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white group transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d97759]/10 flex-shrink-0">
                      <svg className="w-4 h-4 text-[#d97759]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900">Canvas Printing</div>
                      <div className="text-xs text-neutral-500">Print your art</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Other Links */}
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
              href="/dashboard"
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
