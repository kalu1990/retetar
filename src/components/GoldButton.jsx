import { useState } from 'react'

export default function GoldButton({ children, onClick, className = '', small = false }) {
  const [hov, setHov] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      data-cursor
      className={`btn-gold-shimmer inline-flex items-center gap-[10px] cursor-none border-none font-cormorant italic transition-all duration-300 ${className}`}
      style={{
        padding: small ? '9px 22px' : '15px 34px',
        fontSize: small ? 13 : 16,
        background: hov
          ? 'linear-gradient(135deg, #F0DC9A, #D4B87A, #C9A96E, #B8925A)'
          : 'linear-gradient(135deg, #D4B87A, #C9A96E, #A8855A)',
        color: '#0C0904',
        boxShadow: hov
          ? '0 0 60px rgba(201,169,110,0.7), 0 12px 40px rgba(0,0,0,0.6)'
          : '0 0 30px rgba(201,169,110,0.42), 0 8px 28px rgba(0,0,0,0.5)',
        transform: hov ? 'translateY(-2px)' : 'none',
        letterSpacing: '0.04em',
      }}
    >
      {children}
    </button>
  )
}
