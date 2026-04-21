import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/bundle-analysis.html',
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'stripe': ['@stripe/react-stripe-js', '@stripe/stripe-js'],
          'firebase': ['firebase'],
          'recharts': ['recharts'],
          'vendor': ['react', 'react-dom', 'react-router-dom'],
        }
      }
    }
  }
});
