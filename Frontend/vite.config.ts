import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      srcDir: '.',
      filename: 'service-worker.js',
    }),
  ],
  resolve: {
    alias: [{ find: '@', replacement: '/src' }],
  },
  base: '/',
  server: {
    port: 3000,
    host: true,
  },
  define: {
    global: 'window',
  },
});
