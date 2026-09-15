import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// O proxy encaminha /api -> backend-pdco (porta 8020) durante o dev.
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5175,
        allowedHosts: ['.trycloudflare.com'],
        proxy: {
            '/api': {
                target: 'http://localhost:8020',
                changeOrigin: true,
            },
        },
    },
})
