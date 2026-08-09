export default function BrandMark({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><linearGradient id="wpscanvas-mark" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse"><stop stopColor="currentColor" /><stop offset="1" stopColor="#9dbd00" /></linearGradient></defs>
    <rect x="4" y="4" width="5" height="16" rx="1.2" fill="currentColor" transform="rotate(-15 12 12)" />
    <rect x="10" y="4" width="5" height="16" rx="1.2" fill="url(#wpscanvas-mark)" transform="rotate(-15 12 12)" />
  </svg>
}
