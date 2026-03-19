/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f9f6f1",
        surface: "#faf8f5",
        caramel: "#f9f6f1",
        accent: {
          cyan: "#22d3ee",
          magenta: "#e879f9",
          green: "#059669",
          emerald: "#10b981",
        },
      },
      fontFamily: {
        sans: ["system-ui", "ui-sans-serif", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;

