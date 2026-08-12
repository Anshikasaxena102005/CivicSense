import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // All /api requests proxied to backend — no CORS issues in dev
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Serve uploaded images directly from backend
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
