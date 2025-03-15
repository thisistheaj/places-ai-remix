import plugins from './tailwind-plugins.cjs';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  plugins,
} 