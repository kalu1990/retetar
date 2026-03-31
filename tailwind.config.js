/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold:     '#C9A96E',
        'gold-l': '#E8D5A3',
        'gold-d': '#8B6914',
        cream:    '#FDF6EC',
        rose:     '#C4788A',
        sage:     '#8FAF8A',
      },
      fontFamily: {
        cormorant: ['"Cormorant Garamond"', 'serif'],
        jost:      ['Jost', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'title-in': {
          from: { opacity: '0', transform: 'translateX(32px) skewX(-1deg)' },
          to:   { opacity: '1', transform: 'translateX(0) skewX(0)' },
        },
        'gbar-in': {
          from: { height: '0px' },
          to:   { height: '175px' },
        },
        'grain': {
          '0%':   { transform: 'translate(0,0)' },
          '50%':  { transform: 'translate(-2px,1px)' },
          '100%': { transform: 'translate(1px,-2px)' },
        },
        'scan': {
          from: { top: '-1px' },
          to:   { top: '100vh' },
        },
        'orb1': {
          from: { transform: 'translate(0,0)' },
          to:   { transform: 'translate(-28px,22px)' },
        },
        'orb2': {
          from: { transform: 'translate(0,0)' },
          to:   { transform: 'translate(22px,-28px)' },
        },
        'shimmer': {
          from: { transform: 'translateX(-200%)' },
          to:   { transform: 'translateX(200%)' },
        },
        'pulse-dot': {
          '0%,100%': { opacity: '0.5', transform: 'scale(0.9)' },
          '50%':     { opacity: '1',   transform: 'scale(1.2)' },
        },
      },
      animation: {
        'fade-up':    'fade-up 0.65s ease forwards',
        'title-in':   'title-in 1.1s cubic-bezier(.16,1,.3,1) 0.28s forwards',
        'gbar-in':    'gbar-in 1.1s ease 0.9s forwards',
        'grain':      'grain 0.45s steps(2) infinite',
        'scan':       'scan 13s linear infinite',
        'orb1':       'orb1 14s ease-in-out infinite alternate',
        'orb2':       'orb2 19s ease-in-out infinite alternate',
        'pulse-dot':  'pulse-dot 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
