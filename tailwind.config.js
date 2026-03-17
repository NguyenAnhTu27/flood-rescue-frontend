/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        rescue: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        urgent: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
        },
        surface: {
          DEFAULT: '#f8fafc',
          card: '#ffffff',
          raised: '#f1f5f9',
        },
        ink: {
          400: '#94a3b8',
          600: '#475569',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Be Vietnam Pro', 'system-ui', 'sans-serif'],
        display: ['Be Vietnam Pro', 'system-ui', 'sans-serif'],
        heading: ['Be Vietnam Pro', 'system-ui', 'sans-serif'],
        body: ['Be Vietnam Pro', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['2.25rem', { lineHeight: '2.75rem', letterSpacing: '-0.03em' }],
        'display-md': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        title: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up-soft': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-urgent': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.03)', opacity: '0.88' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 240ms ease-out',
        'slide-up-soft': 'slide-up-soft 180ms ease-out',
        'pulse-urgent': 'pulse-urgent 1.6s ease-in-out infinite',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(15, 23, 42, 0.06), 0 10px 24px rgba(15, 23, 42, 0.04)',
        float: '0 12px 32px rgba(15, 23, 42, 0.10)',
        insetsoft: 'inset 0 1px 0 rgba(255, 255, 255, 0.7)',
      },
    },
  },
  plugins: [],
}

