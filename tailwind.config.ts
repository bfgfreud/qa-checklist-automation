import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./frontend/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Bonfire Gathering brand colors
        primary: {
          50: "#fff5f0",
          100: "#ffe8db",
          200: "#ffccb3",
          300: "#ffad85",
          400: "#ff8a52",
          500: "#FF6B35", // Main brand orange
          600: "#e65a28",
          700: "#cc491c",
          800: "#a63915",
          900: "#802c10",
          950: "#4d1a09",
        },
        // Dark theme colors
        dark: {
          bg: "#0a0a0a",
          surface: "#1a1a1a",
          elevated: "#2a2a2a",
          border: "#3a3a3a",
          text: {
            primary: "#ffffff",
            secondary: "#a0a0a0",
            tertiary: "#707070",
          },
        },
      },
      backgroundColor: {
        "dark-primary": "#0a0a0a",
        "dark-secondary": "#1a1a1a",
        "dark-tertiary": "#2a2a2a",
      },
      borderColor: {
        "dark-primary": "#3a3a3a",
        "dark-secondary": "#4a4a4a",
      },
      textColor: {
        "dark-primary": "#ffffff",
        "dark-secondary": "#a0a0a0",
        "dark-tertiary": "#707070",
      },
    },
  },
  plugins: [],
};

export default config;
