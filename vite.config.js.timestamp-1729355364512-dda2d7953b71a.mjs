// vite.config.js
import { defineConfig } from "file:///C:/Users/Hammad/Code/react/ems/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Hammad/Code/react/ems/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { resolve } from "path";
import vercel from "file:///C:/Users/Hammad/Code/react/ems/node_modules/vite-plugin-vercel/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\Hammad\\Code\\react\\ems";
console.log(process.env.port);
var vite_config_default = defineConfig({
  server: {
    port: process.env.port ?? 5173
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__vite_injected_original_dirname, "index.html")
      }
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
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxIYW1tYWRcXFxcQ29kZVxcXFxyZWFjdFxcXFxlbXNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEhhbW1hZFxcXFxDb2RlXFxcXHJlYWN0XFxcXGVtc1xcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvSGFtbWFkL0NvZGUvcmVhY3QvZW1zL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCdcclxuaW1wb3J0IHZlcmNlbCBmcm9tIFwidml0ZS1wbHVnaW4tdmVyY2VsXCJcclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuY29uc29sZS5sb2cocHJvY2Vzcy5lbnYucG9ydClcclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBzZXJ2ZXI6IHtcclxuICAgIHBvcnQ6IHByb2Nlc3MuZW52LnBvcnQgPz8gNTE3M1xyXG4gIH0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgaW5wdXQ6IHtcclxuICAgICAgICBtYWluOiByZXNvbHZlKF9fZGlybmFtZSwgJ2luZGV4Lmh0bWwnKSxcclxuICAgICAgfSxcclxuICAgIH1cclxuICB9LFxyXG4gIGJhc2U6IFwiL1wiLFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICB2ZXJjZWwoKVxyXG4gIF0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgc3JjOiBcIi9zcmNcIixcclxuICAgICAgXCJAXCI6IFwiL3NyY1wiXHJcbiAgICB9XHJcbiAgfSxcclxuICBkZWZpbmU6IHtcclxuICAgIHByb2R1Y3Rpb246IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52LnByb2R1Y3Rpb24pXHJcbiAgfVxyXG59KVxyXG5cclxuXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBd1IsU0FBUyxvQkFBb0I7QUFDclQsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsZUFBZTtBQUN4QixPQUFPLFlBQVk7QUFIbkIsSUFBTSxtQ0FBbUM7QUFLekMsUUFBUSxJQUFJLFFBQVEsSUFBSSxJQUFJO0FBQzVCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFFBQVE7QUFBQSxJQUNOLE1BQU0sUUFBUSxJQUFJLFFBQVE7QUFBQSxFQUM1QjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLE1BQ2IsT0FBTztBQUFBLFFBQ0wsTUFBTSxRQUFRLGtDQUFXLFlBQVk7QUFBQSxNQUN2QztBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxNQUFNO0FBQUEsRUFDTixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsRUFDVDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSztBQUFBLE1BQ0wsS0FBSztBQUFBLElBQ1A7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixZQUFZLEtBQUssVUFBVSxRQUFRLElBQUksVUFBVTtBQUFBLEVBQ25EO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
