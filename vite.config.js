import { defineConfig } from 'vite';

const proxy = {
  '/api/atlas/': {
    target: 'https://atlas.letz.ai',
    changeOrigin: true,
    timeout: 12000,
    proxyTimeout: 11000,
    rewrite: path => path.replace(/^\/api\/atlas\//, '/api/public/atlas/effects/'),
  },
};

export default defineConfig({
  server: { proxy },
  preview: { proxy },
  build: {
    rollupOptions: {
      output: {
        manualChunks: id => /\/data\/(atlas-media|cover-previews)\.json$/.test(id) ? 'catalog-covers' : undefined,
      },
    },
  },
});
