import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-roboto-slab)", "Arial", "sans-serif"],
        editorial: ["var(--font-roboto-slab)", "Arial", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"]
      },
      colors: {
        ink: "var(--color-ink)",
        deep: "var(--color-deep)",
        muted: "var(--color-muted)",
        line: "var(--color-line)",
        canvas: "var(--color-canvas)",
        surface: "var(--color-surface)",
        "surface-secondary": "var(--color-surface-secondary)",
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        "primary-muted": "var(--color-primary-muted)",
        "primary-contrast": "var(--color-primary-contrast)",
        accent: "var(--color-accent)",
        coral: "var(--color-coral)"
      },
      boxShadow: {
        card: "0 16px 48px rgba(32, 61, 56, .08)"
      }
    }
  },
  plugins: []
};

export default config;
