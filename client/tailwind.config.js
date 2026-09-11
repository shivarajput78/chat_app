/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./context/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        panel: "#0d1418",
        panelLight: "#111b21",
        surface: "#1b262c",
        bubbleOut: "#134d3b",
        bubbleIn: "#1f2c33",
        accent: "#2fbf8f",
        accentDeep: "#0e5f4c",
        muted: "#8696a0",
        line: "#22303a",
      },
      fontFamily: {
        sans: ["Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
