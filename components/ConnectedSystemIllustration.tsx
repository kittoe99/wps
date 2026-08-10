export default function ConnectedSystemIllustration() {
  return <div className="growth-system-illustration" aria-label="Website, phone, and review signals flowing into booked appointments" role="img">
    <svg viewBox="0 0 1000 540" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="system-line" x1="385" y1="0" x2="710" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#A7C900" /><stop offset="1" stopColor="#D9FF4F" /></linearGradient>
        <linearGradient id="system-panel" x1="60" y1="70" x2="384" y2="420" gradientUnits="userSpaceOnUse"><stop stopColor="#FAFAF6" /><stop offset="1" stopColor="#E6E6DE" /></linearGradient>
        <filter id="system-shadow" x="30" y="40" width="860" height="460" filterUnits="userSpaceOnUse"><feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#1C1C19" floodOpacity=".12" /></filter>
      </defs>
      <circle cx="795" cy="270" r="212" fill="#E4F29A" opacity=".32" /><circle cx="795" cy="270" r="157" stroke="#B2CF2B" strokeOpacity=".24" />
      <g filter="url(#system-shadow)">
        <rect x="55" y="75" width="330" height="108" rx="18" fill="url(#system-panel)" stroke="#D3D3CA" />
        <rect x="55" y="215" width="330" height="108" rx="18" fill="url(#system-panel)" stroke="#D3D3CA" />
        <rect x="55" y="355" width="330" height="108" rx="18" fill="url(#system-panel)" stroke="#D3D3CA" />
      </g>
      <rect x="80" y="101" width="52" height="52" rx="15" fill="#1B1B19" /><path d="M96 113H116C118.209 113 120 114.791 120 117V134C120 136.209 118.209 138 116 138H108L104 143V138H96C93.791 138 92 136.209 92 134V117C92 114.791 93.791 113 96 113Z" stroke="#D9FF4F" strokeWidth="2.5" /><path d="M145 112H301M145 128H275M145 144H220" stroke="#76766F" strokeWidth="8" strokeLinecap="round" />
      <rect x="80" y="241" width="52" height="52" rx="15" fill="#1B1B19" /><path d="M98 253.5C98 252.672 98.672 252 99.5 252H104.5C105.328 252 106 252.672 106 253.5V258.5C106 259.328 105.328 260 104.5 260H102L106.2 266.1C107.25 267.63 108.37 269.104 109.56 270.52L115.1 266.86C115.79 266.404 116.72 266.59 117.18 267.28L119.92 271.43C120.38 272.12 120.19 273.05 119.5 273.51L113.26 277.63C112.12 278.38 110.65 278.43 109.47 277.76C104.75 275.09 100.91 271.25 98.24 266.53C97.57 265.35 97.62 263.88 98.37 262.74L102 257.24H99.5C98.672 257.24 98 256.568 98 255.74V253.5Z" fill="#D9FF4F" /><path d="M147 275H158L164 263L171 282L179 255L186 275H203" stroke="#85857D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="80" y="381" width="52" height="52" rx="15" fill="#1B1B19" /><path d="M106 391L110.6 400.3L120.9 401.8L113.45 409.06L115.21 419.32L106 414.48L96.79 419.32L98.55 409.06L91.1 401.8L101.4 400.3L106 391Z" fill="#D9FF4F" /><path d="M147 407H162M174 407H189M201 407H216M228 407H243" stroke="#75756E" strokeWidth="10" strokeLinecap="round" />
      <path d="M385 129H536C570 129 570 270 604 270H686" stroke="url(#system-line)" strokeWidth="4" /><path d="M385 269H686" stroke="url(#system-line)" strokeWidth="4" /><path d="M385 409H536C570 409 570 270 604 270" stroke="url(#system-line)" strokeWidth="4" />
      <circle cx="385" cy="129" r="7" fill="#D9FF4F" /><circle cx="385" cy="269" r="7" fill="#D9FF4F" /><circle cx="385" cy="409" r="7" fill="#D9FF4F" /><circle cx="687" cy="270" r="13" fill="#D9FF4F" /><circle cx="687" cy="270" r="23" stroke="#B5D421" strokeOpacity=".35" />
      <g filter="url(#system-shadow)"><rect x="710" y="120" width="220" height="300" rx="28" fill="#1B1B19" /><rect x="724" y="134" width="192" height="272" rx="20" stroke="#464640" /><rect x="746" y="180" width="148" height="162" rx="14" fill="#272724" /><path d="M746 207H894" stroke="#D9FF4F" strokeWidth="8" /><rect x="763" y="225" width="24" height="24" rx="6" fill="#42423D" /><rect x="800" y="225" width="24" height="24" rx="6" fill="#42423D" /><rect x="837" y="225" width="24" height="24" rx="6" fill="#42423D" /><rect x="763" y="262" width="24" height="24" rx="6" fill="#42423D" /><rect x="800" y="262" width="24" height="24" rx="6" fill="#D9FF4F" /><rect x="837" y="262" width="24" height="24" rx="6" fill="#42423D" /><rect x="763" y="299" width="24" height="24" rx="6" fill="#42423D" /><rect x="800" y="299" width="24" height="24" rx="6" fill="#42423D" /><rect x="837" y="299" width="24" height="24" rx="6" fill="#42423D" /><path d="M773 161V185M867 161V185" stroke="#D9FF4F" strokeWidth="8" strokeLinecap="round" /></g>
      <text x="759" y="375" fill="#F5F5EE" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700" letterSpacing="2">APPOINTMENT SET</text>
    </svg>
  </div>
}
