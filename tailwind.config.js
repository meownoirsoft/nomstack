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
      styled: true,
      base: false,
      themes: [
        {
          nomstack: {
            "primary": "#663399",
            "secondary": "#E6E6FA",
            "accent": "#EE82EE",
          },
        },
        "nomstack", // Default themes
      ],
    },
};