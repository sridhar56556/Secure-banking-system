import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  cacheDir: './node_modules/.vite_new_cache', // Bypassing locked folder
  server: {
    open: true,
    port: 5173,
  }
})
