import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Vite build configuration specifically for the Standalone Windows Desktop Workstation
export default defineConfig({
  base: './',
  plugins: [
    tailwindcss(),
    react()
  ],
  build: {
    outDir: '../desktop-app/dist-ui',
    emptyOutDir: true,
    minify: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'desktop-studio.html')
    }
  }
})
