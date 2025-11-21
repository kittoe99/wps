'use client'

import Image from "next/image"
import { useState, useRef } from 'react'

export default function Home() {
  const [activeTab, setActiveTab] = useState('generate')
  const [prompt, setPrompt] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const quickIdeasRef = useRef<HTMLDivElement | null>(null)

  const promptExamples = [
    {
      label: 'Abstract geometric patterns',
      image: '/wps-canvas.png',
    },
    {
      label: 'Minimalist mountain landscape',
      image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=400&q=80',
    },
    {
      label: 'Vibrant sunset over ocean',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
    },
    {
      label: 'Modern art with bold colors',
      image: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=400&q=80',
    },
    {
      label: 'Black & white city skyline',
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80',
    },
    {
      label: 'Cozy living room gallery wall',
      image: 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=400&q=80',
    },
    {
      label: 'Minimal line art portrait',
      image: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=400&q=80',
    },
    {
      label: 'Soft pastel landscape',
      image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=400&q=80',
    },
  ]

  const scrollQuickIdeas = (direction: 'left' | 'right') => {
    const container = quickIdeasRef.current
    if (!container) return
    const amount = direction === 'left' ? -200 : 200
    container.scrollBy({ left: amount, behavior: 'smooth' })
  }

  const generateImage = () => {
    if (!prompt.trim()) return
    console.log('Generating image with prompt:', prompt)
    // Navigate to dashboard or show generation UI
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setUploadedFile(event.target.files[0])
    }
  }

  const handleFileDrop = (event: React.DragEvent) => {
    event.preventDefault()
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      setUploadedFile(event.dataTransfer.files[0])
    }
  }

  const proceedWithUpload = () => {
    if (!uploadedFile) return
    console.log('Proceeding with file:', uploadedFile.name)
  }

  return (
    <main className="min-h-screen bg-[#f9f8f6]">
      {/* Hero Section */}
      <section className="relative -mt-6 pt-0 pb-12 md:mt-0 md:pt-6 md:pb-20 bg-white overflow-hidden">
        <div className="relative mx-auto max-w-5xl px-4 md:px-6 lg:px-8">
          {/* SVG Pattern Background - positioned absolutely behind text */}
          <div className="absolute left-0 top-0 w-full h-[280px] md:h-[330px] pointer-events-none">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 mx-auto w-[85%] md:w-[60%] h-full flex items-start justify-center overflow-hidden">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <pattern id="heroDots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="2" fill="#f4cdb4" opacity="0.5" />
                    </pattern>
                  </defs>

                  {/* dotted texture */}
                  <rect width="1200" height="400" fill="url(#heroDots)" opacity="0.4" />

                  <g fill="none" stroke="#efc2a9" strokeWidth="1.6" opacity="0.65">
                    {/* single sweeping arc */}
                    <path d="M-150 260 Q 150 40 540 200 T 1080 190" />

                    {/* quarter circle outline */}
                    <path d="M80 100 Q 80 20 160 20 H440" opacity="0.5" />

                    {/* subtle concentric circle */}
                    <circle cx="540" cy="210" r="110" opacity="0.45" />
                    <circle cx="540" cy="210" r="70" opacity="0.35" />

                    {/* thin diagonal */}
                    <line x1="220" y1="40" x2="500" y2="220" opacity="0.4" />
                  </g>
                </svg>
              </div>
            </div>
          </div>

          {/* Hero text in foreground */}
          <div className="relative z-10 text-center pt-24 md:pt-32 pb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 mb-4 leading-tight">
              Turn Your Ideas Into
              <span className="block text-[#d97759]">Stunning Canvas Art</span>
            </h1>
            <p className="text-base md:text-lg text-neutral-600 max-w-2xl mx-auto">
              Generate with AI or upload your own image. Transform any vision into
              <span className="font-semibold text-neutral-900"> gallery-quality canvas prints</span> in minutes.
            </p>
          </div>

          <div className="relative bg-white rounded-2xl md:rounded-3xl border border-neutral-200 p-4 md:p-6 lg:p-8 shadow-sm">
            {/* Tabs */}
            <div className="relative flex gap-1 md:gap-2 mb-6 md:mb-8 p-1 bg-neutral-100/80 rounded-xl w-full md:w-fit border border-neutral-200">
              <button
                onClick={() => setActiveTab('generate')}
                className={`flex-1 md:flex-none px-3 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-semibold transition-all duration-300 rounded-lg relative ${
                  activeTab === 'generate' 
                    ? 'text-white bg-gradient-to-r from-[#d97759] to-[#c46a4f] shadow-lg shadow-[#d97759]/25' 
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-1.5 md:gap-2">
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="whitespace-nowrap">Generate with AI</span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 md:flex-none px-3 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-semibold transition-all duration-300 rounded-lg relative ${
                  activeTab === 'upload' 
                    ? 'text-white bg-gradient-to-r from-[#d97759] to-[#c46a4f] shadow-lg shadow-[#d97759]/25' 
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-1.5 md:gap-2">
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span className="whitespace-nowrap">Upload Image</span>
                </span>
              </button>
            </div>

            {/* Generate Tab */}
            {activeTab === 'generate' && (
              <div className="relative space-y-6">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#d97759] to-[#c46a4f] rounded-2xl opacity-0 group-focus-within:opacity-20 blur transition duration-300"></div>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your vision... (e.g., 'A serene mountain landscape at sunset with vibrant colors and dramatic clouds')"
                    rows={5}
                    className="relative w-full px-5 py-4 bg-white border border-neutral-200 rounded-2xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#d97759] focus:ring-2 focus:ring-[#d97759]/10 resize-none transition-all duration-300 text-base"
                  ></textarea>
                  <div className="absolute bottom-4 right-4 flex items-center gap-2">
                    <button
                      type="button"
                      className="p-2.5 rounded-xl hover:bg-neutral-100 transition-all duration-200 group/btn"
                      title="Add image reference"
                    >
                      <svg className="h-5 w-5 text-neutral-500 group-hover/btn:text-neutral-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                      </svg>
                    </button>
                    <button
                      onClick={generateImage}
                      disabled={!prompt.trim()}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d97759] to-[#c46a4f] text-white font-semibold hover:shadow-lg hover:shadow-[#d97759]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 flex items-center gap-2"
                      title="Generate"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                      Generate
                    </button>
                  </div>
                </div>
                
                {/* Quick Prompts */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-neutral-500 flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-[#d97759]" />
                      Quick start ideas
                    </p>
                    <div className="hidden md:flex items-center gap-1 text-neutral-500">
                      <button
                        type="button"
                        onClick={() => scrollQuickIdeas('left')}
                        className="h-7 w-7 flex items-center justify-center rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 text-xs"
                        aria-label="Scroll ideas left"
                      >
                        
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollQuickIdeas('right')}
                        className="h-7 w-7 flex items-center justify-center rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 text-xs"
                        aria-label="Scroll ideas right"
                      >
                        
                      </button>
                    </div>
                  </div>
                  <div
                    ref={quickIdeasRef}
                    className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
                  >
                    {promptExamples.map((example) => (
                      <div
                        key={example.label}
                        className="flex-shrink-0 snap-start w-32 md:w-40"
                      >
                        <button
                          type="button"
                          onClick={() => setPrompt(example.label)}
                          className="w-full px-3.5 py-1.5 text-xs md:text-sm font-medium rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-[#d97759] hover:bg-[#fff3ec] transition-colors duration-200 whitespace-nowrap overflow-hidden text-ellipsis"
                        >
                          {example.label}
                        </button>
                        <div className="mt-2 rounded-xl border border-neutral-200 overflow-hidden bg-neutral-100">
                          <div className="relative aspect-[4/3]">
                            <Image
                              src={example.image}
                              alt={example.label}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div className="relative space-y-6">
                <div
                  onClick={triggerFileUpload}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="group relative border border-dashed border-neutral-300 rounded-2xl p-16 text-center hover:border-[#d97759] hover:bg-gradient-to-br hover:from-[#d97759]/5 hover:to-transparent transition-all duration-300 cursor-pointer"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-5">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#d97759]/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d97759]/10 to-[#c46a4f]/10 group-hover:from-[#d97759]/20 group-hover:to-[#c46a4f]/20 transition-all duration-300 transform group-hover:scale-110">
                        <svg className="h-10 w-10 text-[#d97759]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-base font-semibold text-neutral-900 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-neutral-600 mb-1">
                        PNG, JPG, WEBP up to 10MB
                      </p>
                      <p className="text-xs text-neutral-500">
                        High resolution images work best
                      </p>
                    </div>
                  </div>
                  {uploadedFile && (
                    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">{uploadedFile.name}</span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={proceedWithUpload}
                  disabled={!uploadedFile}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#d97759] to-[#c46a4f] text-white font-semibold hover:shadow-xl hover:shadow-[#d97759]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  <span>Continue with Upload</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Canvas Showcase */}
          <div className="mt-24">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#d97759]/10 border border-[#d97759]/20 text-sm font-semibold text-[#d97759] mb-4">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Gallery
              </div>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 mb-4">
                Canvas Showcase
              </h3>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                Explore stunning examples of canvas prints created by our community
              </p>
            </div>

            {/* Canvas Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {[
                { src: '/wps-canvas.png', size: '24" × 36"' },
                { src: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=400&q=80', size: '18" × 24"' },
                { src: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=400&q=80', size: '12" × 16"' },
                { src: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=400&q=80', size: '18" × 24"' },
                { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=80', size: '24" × 36"' },
                { src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80', size: '30" × 40"' },
                { src: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80', size: '16" × 20"' },
                { src: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=400&q=80', size: '18" × 24"' },
                { src: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=400&q=80', size: '20" × 30"' },
                { src: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80', size: '16" × 20"' },
                { src: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=400&q=80', size: '12" × 16"' },
                { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=80', size: '18" × 24"' },
              ].map((canvas, index) => (
                <div key={index} className="group cursor-pointer transform hover:-translate-y-2 transition-all duration-300">
                  <div className="relative bg-white p-4 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-lg">
                    <div className="relative border-[6px] border-neutral-900 overflow-hidden rounded-sm">
                      <div className="aspect-square relative">
                        <Image
                          src={canvas.src}
                          alt="Canvas print"
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                          <span className="text-white text-sm font-semibold px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                            View Details
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* 3D depth effect */}
                    <div className="absolute inset-0 pointer-events-none shadow-inner rounded-lg"></div>
                    <div className="absolute -bottom-1 -right-1 w-full h-full bg-neutral-200 rounded-lg -z-10"></div>
                  </div>
                  <div className="mt-3 flex items-center justify-between px-1">
                    <p className="text-sm font-medium text-neutral-700">{canvas.size}</p>
                    <div className="flex items-center gap-1 text-[#d97759]">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs font-semibold">Premium</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
