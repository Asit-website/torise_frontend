import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 🌟 यह जरूरी है
    port: 5001,
    proxy: {
      '/api': {
        target: 'https://torise-backend-1.onrender.com',
        changeOrigin: true,
      },
    },
    allowedHosts: ['ui.torisedigital.com'], // ✅ Add your domain here
  },
});
