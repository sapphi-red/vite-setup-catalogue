import { defineConfig } from 'vite'
import dns from 'dns'

dns.setDefaultResultOrder('verbatim')

export default defineConfig({
  server: {
    port: 5183,
    origin: 'http://localhost:5183',
    strictPort: true,
    // can be removed after https://github.com/vitejs/vite/pull/19249
    cors: { origin: 'http://localhost:3000' }
  },
  build: {
    manifest: true,
    rollupOptions: {
      input: './frontend-src/main.js'
    }
  }
})
