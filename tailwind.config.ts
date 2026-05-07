import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Wedora Design System
        bg: "#FAF7F2",
        surface: "#FFFFFF",
        "primary-text": "#1E1E1E",
        "secondary-text": "#666666",
        rose: {
          DEFAULT: "#EFD6D2",
          50: "#FDF8F7",
          100: "#F9EDED",
          200: "#EFD6D2",
          300: "#E4BAB4",
          400: "#D49A92",
          500: "#C07870",
        },
        gold: {
          DEFAULT: "#D4AF37",
          50: "#FBF7E8",
          100: "#F5EBC4",
          200: "#EDD98A",
          300: "#D4AF37",
          400: "#B8940E",
          500: "#8F7209",
        },
        border: "#ECE7E1",
        wedora: {
          bg: "#FAF7F2",
          surface: "#FFFFFF",
          text: "#1E1E1E",
          muted: "#666666",
          rose: "#EFD6D2",
          gold: "#D4AF37",
          border: "#ECE7E1",
        },
      },
      fontFamily: {
        heading: ["Playfair Display", "Georgia", "serif"],
        body: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        soft: "0 2px 20px rgba(0,0,0,0.04)",
        card: "0 4px 24px rgba(0,0,0,0.06)",
        elevated: "0 8px 40px rgba(0,0,0,0.10)",
        gold: "0 4px 24px rgba(212,175,55,0.15)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
        shimmer: "shimmer 2s infinite linear",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
