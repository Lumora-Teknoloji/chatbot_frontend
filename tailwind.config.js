// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            transitionDuration: {
                '700': '700ms',
                '1000': '1000ms',
                '2000': '2000ms',
            },
        },
    },

    plugins: [
        require('@tailwindcss/typography')
    ],
};