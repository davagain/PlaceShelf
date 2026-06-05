import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui"]
      },
      colors: {
        ink: "#1d211c",
        paper: "#f7f4ec",
        moss: "#6f8062",
        tomato: "#d75d41",
        chartreuse: "#c9d86f",
        canal: "#426a79"
      },
      boxShadow: {
        panel: "0 22px 70px rgba(29, 33, 28, 0.12)",
        lift: "0 14px 40px rgba(29, 33, 28, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
