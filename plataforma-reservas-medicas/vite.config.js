import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    // Configuración del proxy para desarrollo
    proxy: {

      // Cualquier petición que empiece con /api
      // será redirigida al backend
      '/api': {
        target: 'http://localhost:8080',  // Tu backend
        changeOrigin: true,               // Cambia el header Origin
      }
    }
  }
})