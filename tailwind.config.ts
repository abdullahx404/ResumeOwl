import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        owl: {
          50: "#ecfdf5",
          100: "#d1fae5",
          600: "#059669",
          700: "#047857",
          900: "#064e3b",
        },
      },
      boxShadow: {
        soft: "0 14px 34px rgba(15, 23, 42, 0.08)",
        lift: "0 18px 42px rgba(15, 23, 42, 0.12)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "soft-pop": {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 220ms ease-out both",
        "soft-pop": "soft-pop 180ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
