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
        // Trip planner palette (matches the Japan itinerary pages)
        trip: {
          ink: "#2b2320",
          paper: "#fdfaf5",
          torii: "#b8443c",
          gold: "#d4a94b",
          teal: "#1f7a72",
          ocean: "#2196a6",
          sand: "#f3e3c3",
          bamboo: "#4f7942",
          sky: "#cfe6ee",
          sunset: "#e8865a",
          plum: "#7a4a6b",
        },
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

