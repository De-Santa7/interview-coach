import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--c-bg)",
        surface: "var(--c-surface)",
        border: "var(--c-border)",
        "border-strong": "var(--c-border-strong)",
        charcoal: "var(--c-charcoal)",
        body: "var(--c-body)",
        muted: "var(--c-muted)",
        accent: "#c49a2a",
        "accent-hover": "#a07e1e",
        "accent-light": "var(--c-accent-light)",
        "accent-mid": "var(--c-accent-mid)",
        success: "#3d9970",
        "success-light": "var(--c-success-light)",
        danger: "#e05252",
        "danger-light": "var(--c-danger-light)",
        info: "#4a7dd4",
        "info-light": "var(--c-info-light)",
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
        card: "var(--shadow-card)",
        "card-md": "var(--shadow-card-md)",
        "card-lg": "var(--shadow-card-lg)",
        "card-accent": "var(--shadow-card-accent)",
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
