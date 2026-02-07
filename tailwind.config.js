/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'selector', // Utilise la classe .dark sur <html>
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}