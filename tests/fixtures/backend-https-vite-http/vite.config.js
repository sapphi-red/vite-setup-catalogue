import { defineConfig } from 'vite'
import dns from 'dns'

dns.setDefaultResultOrder('verbatim')

export default defineConfig({
  server: {
    port: 7001,
    strictPort: true,
    // can be removed after https://github.com/vitejs/vite/pull/19249
    cors: { origin: 'https://localhost:7002' },
    // for consistency
    watch: {
      usePolling: true,
      interval: 100
    }
  }
})
