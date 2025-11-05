/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        afacad: ["var(--font-afacad)", "sans-serif"],
        holtwood: ["var(--font-holtwood)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
