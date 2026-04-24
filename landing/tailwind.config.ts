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
        navy: "#1E3557",
        "navy-deep": "#152843",
        teal: "#3A8FA5",
        "teal-light": "#4FAAC2",
        "teal-pale": "#E8F4F8",
        bg: "#F8F7F4",
        "bg-warm": "#F2F0EC",
        "text-dark": "#1A2B3C",
        "text-mid": "#4A6080",
        "text-light": "#7A94AD",
        border: "#E2E8ED",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        "card-lg": "20px",
      },
      boxShadow: {
        card: "0 4px 24px rgba(30,53,87,0.08)",
        "card-lg": "0 16px 56px rgba(30,53,87,0.16)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both",
        "fade-right": "fadeRight 0.7s cubic-bezier(0.22,1,0.36,1) both",
        "pop-in": "popIn 0.55s cubic-bezier(0.34,1.56,0.64,1) both",
        "float-up": "floatUp 2.8s ease-in-out infinite",
        "float-down": "floatDown 3.2s ease-in-out infinite",
        pulse: "pulseDot 2s infinite",
        "demo-pulse": "demoPulse 2.2s infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeRight: {
          from: { opacity: "0", transform: "translateX(36px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        popIn: {
          from: { opacity: "0", transform: "scale(0.85) translateY(10px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        floatUp: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        floatDown: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(6px)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.4)" },
        },
        demoPulse: {
          "0%, 100%": {
            boxShadow:
              "0 0 0 4px rgba(58,143,165,0.25), 0 0 0 8px rgba(58,143,165,0.1)",
          },
          "50%": {
            boxShadow:
              "0 0 0 6px rgba(58,143,165,0.35), 0 0 0 14px rgba(58,143,165,0.06)",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
