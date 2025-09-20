// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
content: [
  "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  "./components/**/*.{js,ts,jsx,tsx,mdx}",
  "./app/**/*.{js,ts,jsx,tsx,mdx}",
],
  theme: {
    extend: {
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        beam: {
          "0%": { transform: "translateX(-100%) skewX(-30deg)" },
          "50%": { transform: "translateX(200%) skewX(-30deg)" },
          "100%": { transform: "translateX(-100%) skewX(-30deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        beam: "beam 2s infinite linear",
        shimmer: "shimmer 1.5s infinite linear",
        "fade-in": "fadeIn 0.8s ease-out forwards",
      },
      backgroundSize: {
        "200%": "200% auto",
      },
    },
  },
  plugins: [
    // Perspective + transform-origin utilities
    function ({ addUtilities }) {
      addUtilities({
        ".perspective-xs": { perspective: "200px" },
        ".perspective-sm": { perspective: "400px" },
        ".perspective-md": { perspective: "600px" },
        ".perspective-lg": { perspective: "800px" },
        ".perspective-xl": { perspective: "1000px" },
        ".perspective-2xl": { perspective: "1200px" },
        ".origin-0": { transformOrigin: "0%" },
      });
    },
  ],
};
export default config;
