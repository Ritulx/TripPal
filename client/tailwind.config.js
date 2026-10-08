/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        trippal: {
          50: '#eefcf3',
          100: '#d7f7e2',
          200: '#b2eec8',
          300: '#7edda8',
          400: '#45c583',
          500: '#20a868',
          600: '#148753',
          700: '#126c45',
          800: '#135639',
          900: '#114731',
        },
      },
    },
  },
  plugins: [],
};