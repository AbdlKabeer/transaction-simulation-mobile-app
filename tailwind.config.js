/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        jakarta: ['PlusJakartaSans_400Regular'],
        'jakarta-medium': ['PlusJakartaSans_500Medium'],
        'jakarta-semibold': ['PlusJakartaSans_600SemiBold'],
        'jakarta-bold': ['PlusJakartaSans_700Bold'],
        'jakarta-extrabold': ['PlusJakartaSans_800ExtraBold'],
      },
      colors: {
        brand: {
          50: '#E8FCFB',
          100: '#CFE0F5', // light text on navy/blue surfaces
          500: '#3DB0A4',
          600: '#309D92', // primary action (teal)
          700: '#224683', // blue
          900: '#101944', // navy
        },
        app: '#F9FAFB',
      },
    },
  },
  plugins: [],
};
