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
        accent: "#e8b923",
        "accent-hover": "#c49a2a",
        "accent-light": "var(--c-accent-light)",
        "accent-mid": "var(--c-accent-mid)",
        teal: "#00b4d8",
        "teal-light": "var(--c-teal-light)",
        success: "#06d6a0",
        "success-light": "var(--c-success-light)",
        danger: "#ef476f",
        "danger-light": "var(--c-danger-light)",
        warning: "#ffd166",
        "warning-light": "var(--c-warning-light)",
        info: "#118ab2",
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
        "card-hover": "var(--shadow-card-hover)",
        "card-teal": "var(--shadow-card-teal)",
        input: "0 0 0 3px rgba(232,185,35,0.18)",
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "14px",
        xl: "18px",
        "2xl": "24px",
      },
      backgroundImage: {
        "hero-dark": "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        "card-subtle": "linear-gradient(145deg, #ffffff, #f8f6f0)",
        "gold-teal": "linear-gradient(135deg, #e8b923, #00b4d8)",
        "teal-gold": "linear-gradient(135deg, #00b4d8, #e8b923)",
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
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(232,185,35,0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(232,185,35,0)" },
        },
        "text-cycle": {
          "0%, 18%":  { opacity: "1", transform: "translateY(0)" },
          "22%, 95%": { opacity: "0", transform: "translateY(-8px)" },
          "100%":     { opacity: "0", transform: "translateY(0)" },
        },
        "slide-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-in": "fade-in 0.3s ease forwards",
        ripple: "ripple 1.4s ease-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "bounce-dot": "bounce-dot 1.4s ease-in-out infinite",
        "spin-slow": "spin-slow 3s linear infinite",
        float: "float 4s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "slide-in-up": "slide-in-up 0.5s cubic-bezier(0.16,1,0.3,1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
