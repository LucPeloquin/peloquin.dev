/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}', // Updated path for App Router
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6f4acb', // Purple accent
        secondary: '#c5b174', // Gold accent
        dark: '#1a1a1a', // Dark background
        'dark-light': '#333333', // Slightly lighter dark
      },
    },
  },
  plugins: [],
};