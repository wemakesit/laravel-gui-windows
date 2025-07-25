import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: 5174,
        cors: true,
        hmr: {
            host: 'localhost',
        },
    },
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}']
            },
            manifest: {
                name: 'Window Estimate System',
                short_name: 'WindowEst',
                description: 'Professional window estimation and quotation system optimised for Surface Pro tablets',
                theme_color: '#2563eb',
                background_color: '#f8fafc',
                display: 'standalone',
                orientation: 'any',
                scope: '/',
                start_url: '/',
                lang: 'en-GB',
                categories: ['business', 'productivity'],
                icons: [
                    {
                        src: '/icons/icon-192x192.svg',
                        sizes: '192x192',
                        type: 'image/svg+xml',
                        purpose: 'any maskable'
                    },
                    {
                        src: '/icons/icon-512x512.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml',
                        purpose: 'any maskable'
                    }
                ],
                shortcuts: [
                    {
                        name: 'Create New Estimate',
                        short_name: 'New Estimate',
                        description: 'Start creating a new window estimate',
                        url: '/estimates/create'
                    },
                    {
                        name: 'View Estimates',
                        short_name: 'Estimates',
                        description: 'View all window estimates',
                        url: '/estimates'
                    },
                    {
                        name: 'Settings',
                        short_name: 'Settings',
                        description: 'Configure system settings',
                        url: '/settings'
                    }
                ]
            }
        })
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
});
