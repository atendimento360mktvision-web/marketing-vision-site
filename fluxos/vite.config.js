import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Gera um único arquivo JS (js/fluxos.js) e um CSS (css/fluxos.css) que o painel carrega só quando a aba é aberta.
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: 'dist', emptyOutDir: true, cssCodeSplit: false, sourcemap: false,
    lib: { entry: 'src/main.jsx', name: 'MVFluxos', formats: ['iife'], fileName: () => 'fluxos.js' },
    rollupOptions: { output: { assetFileNames: 'fluxos.[ext]' } }
  }
});
