import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#fafaf8",
        surface: "#ffffff",
        border: "#ebe8e0",
        "border-strong": "#d4d0c8",
        charcoal: "#18181a",
        body: "#52524e",
        muted: "#9c9a94",
        accent: "#c49a2a",
        "accent-hover": "#a07e1e",
        "accent-light": "#fef8ec",
        "accent-mid": "#f5e5b0",
        success: "#3d9970",
        "success-light": "#edf7f3",
        danger: "#e05252",
        "danger-light": "#fdf2f2",
        info: "#4a7dd4",
        "info-light": "#eef3fc",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
      },
      boxShadow: {
        card: "0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px #ebe8e0",
        "card-md": "0 4px 16px rgba(0,0,0,0.07), 0 0 0 1px #ebe8e0",
        "card-lg": "0 8px 32px rgba(0,0,0,0.09), 0 0 0 1px #ebe8e0",
        "card-accent": "0 4px 16px rgba(196,154,42,0.15), 0 0 0 1px #c49a2a",
        input: "0 0 0 3px rgba(196,154,42,0.15)",
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "14px",
        xl: "18px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        ripple: {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "bounce-dot": {
          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: "0.4" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-in": "fade-in 0.3s ease forwards",
        ripple: "ripple 1.4s ease-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "bounce-dot": "bounce-dot 1.4s ease-in-out infinite",
        "spin-slow": "spin-slow 3s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
