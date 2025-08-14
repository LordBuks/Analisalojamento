import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    hmr: {
      port: 8080,
    },
    watch: {
      usePolling: true,
    },
    allowedHosts: [
      "8080-i75v2nd834mqmztgrm2dz-0cf01204.manusvm.computer",
      "3000-iipzythz97d5flyunvh6b-c1fa736c.manusvm.computer",
      "8080-ii2t86670edzkzxpwz840-237db46c.manusvm.computer",
      "localhost",
      "127.0.0.1",
      "4173-iuwpw43i0pligwknihg7u-a3180ed9.manusvm.computer"
    ],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});;