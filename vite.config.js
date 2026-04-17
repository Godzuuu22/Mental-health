import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // your backend server (Lab 9 port)
        changeOrigin: true,
      },
      // Lab 9 endpoints
      '/moods': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/mood': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
