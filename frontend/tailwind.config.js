/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#41271b',
          light: '#5a3828',
          dark: '#2d1b12',
        },
        secondary: {
          DEFAULT: '#975536',
          light: '#b36b4a',
          dark: '#7d4429',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'dropdown-in': {
          '0%':   { opacity: '0', transform: 'translateY(-6px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0)   scale(1)' },
        },
      },
      animation: {
        'in': 'dropdown-in 0.15s ease-out both',
      },
    },
  },
  plugins: [],
};
