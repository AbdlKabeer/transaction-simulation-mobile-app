/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#eef6ff', 100: '#d9eaff', 500: '#1d6df2', 600: '#1558cc', 700: '#0f43a0', 900: '#0a2a66' },
      },
    },
  },
  plugins: [],
};
