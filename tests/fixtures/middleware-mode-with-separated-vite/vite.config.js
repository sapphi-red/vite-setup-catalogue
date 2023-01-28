import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 7003,
    strictPort: true,
    // for consistency
    watch: {
      usePolling: true,
      interval: 100
    }
  }
})
