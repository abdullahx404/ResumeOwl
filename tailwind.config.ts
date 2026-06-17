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
        soft: "0 12px 32px rgba(17, 24, 39, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
