import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
	plugins: [sveltekit()],
	build: {
        rollupOptions: {
            onwarn: (warning, handler) => {
                const { code, frame } = warning;
                if (code === "anchor-is-valid" || code === "a11y-autofocus") {
                    return;
                }
                // or it might be css_unused_selector, depending on the vite version
                if (code === "css-unused-selector" && frame && frame.includes("shape")) {
                    return;
                }
                handler(warning);
            }
        }
    },
});