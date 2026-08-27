import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' keeps asset paths relative, so the build works whether it is
// served from a domain root or from a /repo-name/ subfolder on GitHub Pages.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist' },
});
