import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isGitHubActions = process.env.GITHUB_ACTIONS === 'true' || process.env.GITHUB_PAGES === 'true';

// https://vitejs.dev/config/
export default defineConfig({
  base: isGitHubActions ? '/-CampusFix-AI/' : './',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
