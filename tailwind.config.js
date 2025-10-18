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
            "primary": "var(--primary)",
            "primary-focus": "var(--primary-focus)",
            "primary-content": "var(--primary-content)",
            "secondary": "var(--secondary)",
            "accent": "#EE82EE",
          },
        },
        "nomstack", // Default themes
      ],
    },
};