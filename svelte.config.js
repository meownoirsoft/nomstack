import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
	kit: {
	  adapter: adapter(),
	  prerender: {
		entries: ['*']
	  }
	},
	onwarn: (warning, handler) => {
		// Suppress all warnings for now (temporary)
		return;
		
		// Original suppression logic (commented out)
		// if (warning.code && warning.code.startsWith('a11y-')) return;
		// if (warning.code && warning.code.includes('export_let_unused')) return;
		// if (warning.code && warning.code.includes('unused')) return;
		// handler(warning);
	},
	preprocess: vitePreprocess(),
};