import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
	plugins: [
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.ico', 'favicon.png', 'icon-192.png', 'icon-512.png', 'no-drama-dinner-decider300.png', 'logo/nomstack-logo-grape.webp'],
			manifest: {
				name: 'nomStack - Meal Planning Made Simple',
				short_name: 'nomStack',
				description: 'Plan your meals, discover recipes, and organize your cooking with ease',
				theme_color: '#8b5cf6',
				background_color: '#1f2937',
				display: 'standalone',
				orientation: 'portrait-primary',
				scope: '/',
				start_url: '/',
				icons: [
					{
						src: 'logo/nomstack-logo-grape.webp',
						sizes: '192x192',
						type: 'image/webp',
						purpose: 'any'
					},
					{
						src: 'logo/nomstack-logo-grape.webp',
						sizes: '512x512',
						type: 'image/webp',
						purpose: 'any'
					},
					{
						src: 'logo/nomstack-logo-grape.webp',
						sizes: '192x192',
						type: 'image/webp',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
				globIgnores: ['**/node_modules/**/*', '**/sw.js', '**/workbox-*.js'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'supabase-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365
							}
						}
					}
				]
			},
			devOptions: {
				enabled: false,
				type: 'module'
			}
		})
	],
	ssr: {
		// Increase timeout for SSR module evaluation
		timeout: 120000, // 2 minutes instead of default 60 seconds
		// Pre-bundle dependencies that are causing issues
		noExternal: ['lucide-svelte']
	},
	optimizeDeps: {
		// Include problematic dependencies for pre-bundling
		include: ['lucide-svelte']
	},
	build: {
		// Increase chunk size warning limit
		chunkSizeWarningLimit: 1000
	}
});
