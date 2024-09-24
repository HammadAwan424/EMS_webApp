/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./index.html"
  ],
  theme: {
    extend: {
      keyframes: {
        mine: {
          "0%, 100%": {width: "0px", flex: "1 1 auto", position: "absolute"},
          "40%": {width: "100%", flex: "1 1 auto", position: "absolute"},
          "45%": {width: "85%", flex: "1 1 auto", position: "absolute"},
          "50%": {width: "93%", flex: "1 1 auto", position: "absolute"},
          "55%": {width: "85%", flex: "1 1 auto", position: "absolute"},
          "60%": {width: "100%", flex: "1 1 auto", position: "absolute"},
        }
      },
      animation: {
        mine: "mine 5s ease-in-out infinite"
      }
    },
  },
  plugins: [],
}