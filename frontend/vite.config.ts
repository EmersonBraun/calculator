import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8080';
  return {
    plugins: [react()],
    server: { proxy: { '/api': { target: apiTarget, changeOrigin: true }, '/healthz': { target: apiTarget, changeOrigin: true } } },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: true,
      coverage: { provider: 'v8', reporter: ['text', 'json-summary'] }
    }
  };
});
