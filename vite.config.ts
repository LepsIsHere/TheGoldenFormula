import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/golden-formula/' : '/',
  test: {
    environment: 'jsdom',
    globals: true,
  },
}));
