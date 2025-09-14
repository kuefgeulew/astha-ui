import plugin from "tailwindcss/plugin";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Used in fx_leaderboard_app.tsx (e.g., from-brand-50, to-brand-100, text-brand-700)
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          700: "#1d4ed8",
        },
      },
    },
  },
  plugins: [
    // Simple "glass" utility used in the leaderboard cards
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".glass": {
          "background-color": "rgba(255,255,255,0.6)",
          "backdrop-filter": "blur(8px)",
          "-webkit-backdrop-filter": "blur(8px)",
        },
      });
    }),
  ],
};
