import type { Config } from "tailwindcss"

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    container: { center: true, padding: "1.25rem" },
    extend: {
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui"] },

      borderRadius: {
        lg: "16px",
        md: "12px",
        sm: "10px",
        pill: "9999px",
      },

      colors: {
        // New design tokens
        bg: "hsl(var(--bg))",
        surface: "hsl(var(--surface))",
        surfaceMuted: "hsl(var(--surface-muted))",
        border: "hsl(var(--border))",
        text: "hsl(var(--text))",
        textMuted: "hsl(var(--text-muted))",

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          pressed: "hsl(var(--primary-pressed))",
          ring: "hsl(var(--primary-ring))",
          soft: "hsl(var(--primary-soft))",
        },

        success: { DEFAULT: "hsl(var(--success))" },
        warning: { DEFAULT: "hsl(var(--warning))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "#ffffff" },
        info: { DEFAULT: "hsl(var(--info))" },

        // Compatibility aliases with previous design system
        background: "hsl(var(--bg))",
        foreground: "hsl(var(--text))",
        muted: {
          DEFAULT: "hsl(var(--surface-muted))",
          foreground: "hsl(var(--text-muted))",
        },
        accent: {
          DEFAULT: "hsl(var(--surface-muted))",
          foreground: "hsl(var(--text))",
        },
        input: "hsl(var(--border))",
        ring: "hsl(var(--primary-ring))",
        card: {
          DEFAULT: "hsl(var(--surface))",
          foreground: "hsl(var(--text))",
        },
        secondary: {
          DEFAULT: "hsl(var(--surface-muted))",
          foreground: "hsl(var(--text))",
        },
        popover: {
          DEFAULT: "hsl(var(--surface))",
          foreground: "hsl(var(--text))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--surface))",
          foreground: "hsl(var(--text))",
          primary: "hsl(var(--primary))",
          "primary-foreground": "hsl(var(--primary-foreground))",
          accent: "hsl(var(--surface-muted))",
          "accent-foreground": "hsl(var(--text))",
          border: "hsl(var(--border))",
          ring: "hsl(var(--primary-ring))",
        },
      },

      boxShadow: {
        card: "0 8px 24px rgba(15, 23, 42, 0.06)",
        cardHover: "0 10px 28px rgba(15, 23, 42, 0.08)",
        dropdown: "0 16px 40px rgba(15, 23, 42, 0.12)",
        toast: "0 10px 28px rgba(15, 23, 42, 0.16)",
      },

      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(var(--primary) / 0.3)" },
          "50%": { boxShadow: "0 0 40px hsl(var(--primary) / 0.6)" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "shine": {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
      },
      animation: {
        "fade-in": "fade-in .2s ease-out",
        "scale-in": "scale-in .2s ease-out",
        "slide-up": "slide-up .2s ease-out",
        "float": "float 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite",
        "bounce-soft": "bounce-soft 2s ease-in-out infinite",
        "shine": "shine 2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config
