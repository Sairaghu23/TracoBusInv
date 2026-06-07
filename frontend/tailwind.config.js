/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          light: '#2a3b5c',
          DEFAULT: '#1a2b4c',
          dark: '#0f1a36',
        },
        darkblue: {
          light: '#3b5998',
          DEFAULT: '#2c4373',
          dark: '#1e2d4e',
        },
        accent: '#ffffff',
        surface: '#f3f4f6', // Light gray for backgrounds
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
