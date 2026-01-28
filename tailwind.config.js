/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6", // primary blue
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        soradin: {
          green: '#0B7A3A',
          greenDark: '#06351B',
          navy: '#1e3a5f',
          navyDark: '#0f172a',
          bg: '#F4F4F1',
          text: '#111827',
        },
        navy: {
          50: '#e8eef4',
          100: '#c5d4e4',
          200: '#9eb8d1',
          300: '#779cbe',
          400: '#5080ab',
          500: '#1e3a5f',
          600: '#172d4d',
          700: '#12243d',
          800: '#0f172a',
          900: '#0a0f1a',
        },
      },
    },
  },
  plugins: [],
};
