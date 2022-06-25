import { defineConfig } from 'vite'
import dns from 'dns'

dns.setDefaultResultOrder('verbatim')

export default defineConfig({
  server: {
    port: 5183,
    strictPort: true
  },
  build: {
    manifest: true,
    rollupOptions: {
      input: './frontend-src/main.js'
    }
  }
})
