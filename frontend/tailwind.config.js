/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0095f6',
        secondary: '#8e8e8e',
      },
    },
  },
  plugins: [],
}

