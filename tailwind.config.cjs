/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep cinematic near-black canvas
        ink: {
          950: '#06060A',
          900: '#0A0A11',
          800: '#101018',
          700: '#171722',
          600: '#20202E',
          500: '#2C2C3E',
        },
        // Warm amber/gold — the primary cinematic accent
        gold: {
          200: '#FBE3A6',
          300: '#F7CE74',
          400: '#FFC24B',
          500: '#F5A623',
          600: '#D98612',
        },
        // Cool indigo/blue secondary accent
        azure: {
          300: '#9DB4FF',
          400: '#6D8BFF',
          500: '#4F6BF5',
          600: '#3A4FD6',
        },
        // Cinematic record red
        record: {
          400: '#FF6B6B',
          500: '#F03E3E',
        },
        teal: {
          300: '#5EEAD4',
          400: '#2DD4BF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'ui-serif', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.045em',
      },
      maxWidth: {
        '8xl': '90rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 30px 60px -30px rgba(0,0,0,0.9)',
        glow: '0 20px 60px -20px rgba(245,166,35,0.45)',
        'glow-sm': '0 10px 30px -12px rgba(245,166,35,0.45)',
        'glow-azure': '0 20px 60px -22px rgba(79,107,245,0.5)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-16px) translateX(6px)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        'record-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.55', transform: 'scale(0.85)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        marquee: 'marquee 42s linear infinite',
        shimmer: 'shimmer 2.5s infinite',
        'gradient-x': 'gradient-x 8s ease infinite',
        'pulse-glow': 'pulse-glow 5s ease-in-out infinite',
        'record-pulse': 'record-pulse 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
