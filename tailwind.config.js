/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#5c62ec',
        'primary-dark': '#4a4edf',
        accent: '#ff00c8',
      }
    },
  },
  plugins: [],
}
