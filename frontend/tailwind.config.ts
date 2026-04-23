import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        muted: "var(--muted)",
        border: "var(--border)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        success: "var(--success)",
        warning: "var(--warning)",
      },
      boxShadow: {
        panel: "0 16px 40px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
