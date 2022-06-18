import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 3000 // caddy 3000 -> vite 5173
    }
  }
})
