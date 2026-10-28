
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    host: '0.0.0.0',
    port: 3000,

    proxy: {
      '/catalog-api': { target: 'https://api.uzautotrailer.uz', changeOrigin: true, secure: true, rewrite: p => p.replace(/^\/catalog-api/, '') },
      '/api': {
        target: 'https://crm-api.uzautotrailer.uz',
        changeOrigin: true,
        secure: true,
      },
    },
  },

  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
});
