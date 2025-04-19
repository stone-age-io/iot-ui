import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    // Generate source maps for better debugging
    sourcemap: true,
    
    // Rollup options
    rollupOptions: {
      output: {
        // Use a simpler chunking strategy
        manualChunks: {
          'vendor': [
            'vue', 
            'vue-router', 
            'pinia'
          ]
          // Remove specific PrimeVue chunking as it's causing issues
        }
      }
    }
  }
})
