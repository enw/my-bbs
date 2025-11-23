import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: 'client',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    include: ['sql.js'],
    esbuildOptions: {
      // Handle CommonJS modules
      mainFields: ['module', 'main']
    }
  },
  assetsInclude: ['**/*.wasm'],
  commonjsOptions: {
    // Transform CommonJS to ES modules
    transformMixedEsModules: true
  }
})
