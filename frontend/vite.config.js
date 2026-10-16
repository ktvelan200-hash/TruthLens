import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            // All /api/* calls → FastAPI backend
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            // Root-level health check lives outside /api
            '/health': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
        },
    },
});
