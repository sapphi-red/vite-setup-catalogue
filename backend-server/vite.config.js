import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    manifest: true,
    rollupOptions: {
      input: './frontend-src/main.js'
    }
  }
})
