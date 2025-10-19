/** @type {import('tailwindcss').Config} */
import typography from "@tailwindcss/typography";
import daisyui from "daisyui";
export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
      extend: {},
    },
    plugins: [typography,daisyui],
    daisyui: {
      logs: false,
      styled: true,
      base: true,
      themes: [
        {
          nomstack: {
            "primary": "#000000",
            "primary-focus": "#333333",
            "primary-content": "#ffffff",
            "secondary": "#64748b",
            "accent": "#EE82EE",
          },
        },
        "nomstack", // Default themes
      ],
    },
};