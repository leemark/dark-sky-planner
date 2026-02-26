import { defineConfig } from 'vite';

export default defineConfig({
  // './' makes all asset paths relative so the build works on GitHub Pages
  // (which serves from a subpath like /repo-name/) without extra config.
  base: './',
  server: {
    port: 5173,
  },
});
