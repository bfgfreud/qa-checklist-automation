/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          400: '#FF8C5A',
          500: '#FF6B35',
          600: '#E55A2B',
        },
        dark: {
          bg: '#0f0f0f',
          surface: '#1a1a1a',
          elevated: '#2a2a2a',
          border: '#333333',
          primary: '#333333',
          secondary: '#1a1a1a',
          'text-primary': '#ffffff',
          'text-secondary': '#b3b3b3',
          'text-tertiary': '#808080',
        },
      },
    },
  },
  plugins: [],
}
