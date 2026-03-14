/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        orangeStrong: "#f97316",
        orangeLight: "#ffedd5",
        orangeMid: "#fdba74"
      }
    }
  },
  plugins: []
};
