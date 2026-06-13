/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand — sampled from the Oolshik logo
        orange: {
          DEFAULT: "#E8612A",
          600: "#D9531E",
          700: "#BF4517",
          soft: "#FCEFE6",
          softer: "#FEF7F2",
        },
        cream: "#F6EEE2",
        // Warm dark sidebar
        ink: {
          DEFAULT: "#211C18",
          2: "#2C2622",
          line: "#3A332E",
        },
        // Neutral canvas
        canvas: "#F7F6F3",
        surface: {
          DEFAULT: "#FFFFFF",
          2: "#FAF9F6",
        },
        line: {
          DEFAULT: "#E7E4DF",
          soft: "#F1EFEB",
        },
        ink_text: {
          DEFAULT: "#2A2522",
          2: "#6B6560",
          3: "#968F88",
        },
        // Status hues
        st: {
          gray: "#8A857F",
          blue: "#2F6FD6",
          amber: "#C98A1E",
          violet: "#7B57C9",
          teal: "#2E9C93",
          red: "#D5492E",
          green: "#2E9E63",
        },
      },
      fontFamily: {
        sans: ["Public Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
