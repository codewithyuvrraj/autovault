import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Site is hosted under /autovault/ on GitHub Pages
  base: '/autovault/',
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5001',
      '/uploads': 'http://localhost:5001',
    },
  },
});
