import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Usa rutas relativas para que el build funcione en GitHub Pages
  // (usuario.github.io/repo/) y también cuando se abre desde cualquier subruta.
  base: './',
});
