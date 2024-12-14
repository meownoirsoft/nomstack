/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
      extend: {
        colors: {
          'nomstack': {
            'primary': '#663399',
            'secondary': '#E6E6FA',
            'accent': '#EE82EE',
          },
        },
      },
    },
    plugins: [require("@tailwindcss/typography"),require('daisyui')],
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