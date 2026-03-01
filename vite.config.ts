import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), basicSsl()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: {
    host: true,
    port: 5173,
    allowedHosts: 'all',
    cors: true,
    proxy: {
      '/v1': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
