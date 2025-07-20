import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
    define: {
        // Make environment variables available to the frontend
        'import.meta.env.VITE_COUCHDB_CONFIG_URL': JSON.stringify(process.env.COUCHDB_CONFIG_URL),
        'import.meta.env.VITE_COUCHDB_ESTIMATES_URL': JSON.stringify(process.env.COUCHDB_ESTIMATES_URL),
    },
});
