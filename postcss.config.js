export default {
  plugins: {
    "@tailwindcss/postcss": {
      // Disable Vite plugin if running in PostCSS mode
      skipInit: true,
    },
  },
};
