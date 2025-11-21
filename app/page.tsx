'use client'

import Image from "next/image"
import { useState, useRef } from 'react'

export default function Home() {
  const [activeTab, setActiveTab] = useState('generate')
  const [prompt, setPrompt] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const promptExamples = [
    'Abstract geometric patterns',
    'Minimalist mountain landscape',
    'Vibrant sunset over ocean',
    'Modern art with bold colors'
  ]

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
    <main className="min-h-screen bg-gradient-to-b from-[#fef6e6] via-[#f9f8f6] to-white">
      {/* Hero Section with Gradient */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#d97759]/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#d97759]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[#d97759]/3 to-transparent rounded-full blur-3xl"></div>
        </div>

        <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-[#d97759]/20 rounded-2xl blur-xl"></div>
                <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d97759] to-[#c46a4f] shadow-lg shadow-[#d97759]/25 transform hover:scale-110 transition-transform duration-300">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.072 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.072 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.072-3.292a1 1 0 00-.364-1.118L4.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-neutral-900 mb-6 leading-tight">
              Turn Your Ideas Into
              <span className="block bg-gradient-to-r from-[#d97759] via-[#e88b6f] to-[#d97759] bg-clip-text text-transparent animate-gradient">
                Stunning Canvas Art
              </span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              Generate with AI or upload your own image. Transform any vision into 
              <span className="font-semibold text-neutral-900"> gallery-quality canvas prints</span> in minutes.
            </p>
            
            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-neutral-200 text-sm font-medium text-neutral-700 shadow-sm">
                <svg className="w-4 h-4 text-[#d97759]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                AI-Powered Generation
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-neutral-200 text-sm font-medium text-neutral-700 shadow-sm">
                <svg className="w-4 h-4 text-[#d97759]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Premium Quality
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-neutral-200 text-sm font-medium text-neutral-700 shadow-sm">
                <svg className="w-4 h-4 text-[#d97759]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Fast Delivery
              </span>
            </div>
          </div>

          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl border border-neutral-200/50 p-8 md:p-10 shadow-2xl shadow-neutral-900/5">
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#d97759]/5 via-transparent to-transparent rounded-3xl pointer-events-none"></div>
            
            {/* Tabs */}
            <div className="relative flex gap-2 mb-8 p-1 bg-neutral-100/80 rounded-xl w-fit">
              <button
                onClick={() => setActiveTab('generate')}
                className={`px-6 py-3 text-sm font-semibold transition-all duration-300 rounded-lg relative ${
                  activeTab === 'generate' 
                    ? 'text-white bg-gradient-to-r from-[#d97759] to-[#c46a4f] shadow-lg shadow-[#d97759]/25' 
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate with AI
                </span>
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-6 py-3 text-sm font-semibold transition-all duration-300 rounded-lg relative ${
                  activeTab === 'upload' 
                    ? 'text-white bg-gradient-to-r from-[#d97759] to-[#c46a4f] shadow-lg shadow-[#d97759]/25' 
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  Upload Image
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
                    className="relative w-full px-5 py-4 bg-white border-2 border-neutral-200 rounded-2xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#d97759] focus:ring-4 focus:ring-[#d97759]/10 resize-none transition-all duration-300 text-base"
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
                  <p className="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#d97759]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Quick start ideas
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                    {promptExamples.map((example) => (
                      <button
                        key={example}
                        onClick={() => setPrompt(example)}
                        className="group flex-shrink-0 px-5 py-2.5 text-sm font-medium bg-gradient-to-br from-white to-neutral-50 border-2 border-neutral-200 rounded-xl hover:border-[#d97759] hover:shadow-md hover:shadow-[#d97759]/10 transition-all duration-300 snap-start whitespace-nowrap transform hover:scale-105"
                      >
                        <span className="bg-gradient-to-r from-neutral-700 to-neutral-900 group-hover:from-[#d97759] group-hover:to-[#c46a4f] bg-clip-text text-transparent transition-all duration-300">
                          {example}
                        </span>
                      </button>
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
                  className="group relative border-3 border-dashed border-neutral-300 rounded-2xl p-16 text-center hover:border-[#d97759] hover:bg-gradient-to-br hover:from-[#d97759]/5 hover:to-transparent transition-all duration-300 cursor-pointer"
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
