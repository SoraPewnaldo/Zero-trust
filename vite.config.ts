import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react({
      // Use babel to process TypeScript syntax in .jsx files
      babel: {
        plugins: [
          ['@babel/plugin-transform-typescript', { isTSX: true, allExtensions: true }],
        ],
      },
      include: /\.(jsx|tsx|js|ts)$/,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
  },
  // Tell esbuild (used for pre-bundling) to treat .jsx as TSX
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.jsx': 'tsx',
        '.js': 'jsx',
      },
    },
  },
}));
