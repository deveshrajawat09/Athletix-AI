/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Athletic palette built around teal, mint, and warm neutrals.
        primary: {
          50: '#edf8f2',
          100: '#d8eee2',
          200: '#b8dfca',
          300: '#8bc9ad',
          400: '#58b08e',
          500: '#2c9d82',
          600: '#23856d',
          700: '#1e6d5b',
          800: '#195849',
          900: '#16483d',
          950: '#0d2f29',
        },
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f8fafc',
          border: '#e2e8f0',
          dark: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(37, 78, 65, 0.07)',
        glow: '0 0 20px -5px rgba(44, 157, 130, 0.25)',
      },
    },
  },
  plugins: [],
};
