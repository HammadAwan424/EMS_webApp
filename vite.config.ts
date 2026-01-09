import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { type UserConfig } from 'vite'
import vercel from "vite-plugin-vercel"

export default {
  server: {
    port: Number(process.env.port ?? 5173)
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    }
  },
  base: "/",
  plugins: [
    react(),
    vercel()
  ],
  resolve: {
    alias: {
      src: "/src",
      "@": "/src"
    }
  },
  define: {
    production: JSON.stringify(process.env.production)
  }
} satisfies UserConfig


