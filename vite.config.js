import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
	plugins: [sveltekit()],
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
