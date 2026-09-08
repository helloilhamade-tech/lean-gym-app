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
        background: "#0c0d0e",
        surface: "#16181a",
        surfaceBorder: "#26292d",
        card: "#1a1d20",
        primary: {
          DEFAULT: "#22c55e", // Athletic vibrant green
          hover: "#16a34a",
          dim: "rgba(34, 197, 94, 0.15)",
        },
        accent: {
          DEFAULT: "#38bdf8", // Sky blue for secondary signals
          dim: "rgba(56, 189, 248, 0.15)",
        },
        warning: {
          DEFAULT: "#f59e0b",
          dim: "rgba(245, 158, 11, 0.15)",
        },
        mutedText: "#94a3b8",
        subtleText: "#64748b",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
