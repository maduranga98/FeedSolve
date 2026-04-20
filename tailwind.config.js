/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1e3a5f",
        accent: "#2e86ab",
        "accent-light": "#d6eef5",
        success: "#27ae60",
        warning: "#f39c12",
        error: "#e74c3c",
        light: "#f8fafb",
        surface: "#ffffff",
        "muted-text": "#6b7b8d",
        "body-text": "#444441",
        border: "#d3d1c7",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
};
