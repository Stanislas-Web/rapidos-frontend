import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './', // Important pour les chemins relatifs (Netlify/VPS)
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/styles/variables.scss";`
      }
    }
  },
  server: {
    port: 5173,
    open: false, 
    host: '0.0.0.0'// ✅ Désactivé pour éviter l'erreur xdg-open sur VPS
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined, // 🔧 Permet de regrouper les fichiers JS
      },
    },
  },
});
