/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          DEFAULT: "#15151a",
          soft: "#3f3f46",
        },
        muted: "#8b8b96",
        accent: {
          DEFAULT: "#4f46e5",
          hover: "#4338ca",
          soft: "#eef0ff",
        },
        card: {
          lavender: "#e4e1fb",
          "lavender-text": "#2f2a6b",
          rose: "#fbe1e6",
          "rose-text": "#7a2b3b",
          dark: "#17171b",
        },
        status: {
          progress: "#4f46e5",
          done: "#7c3aed",
          hold: "#c2410c",
        },
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      backgroundImage: {
        shell:
          "linear-gradient(135deg, #6f63e6 0%, #9d6fce 45%, #e39fa8 100%)",
      },
      boxShadow: {
        panel: "0 30px 80px -20px rgba(31, 20, 70, 0.35)",
        soft: "0 8px 24px -8px rgba(20, 20, 30, 0.12)",
      },
    },
  },
  plugins: [],
};
