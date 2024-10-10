import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import vercel from "vite-plugin-vercel"
// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  base: "./",
  plugins: [
    react(),
    vercel()
  ],
  resolve: {
    alias: {
      src: "/src"
    }
  },
  define: {
    production: JSON.stringify(process.env.production)
  }
})


