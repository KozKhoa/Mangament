/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./pages/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        afacad: ["var(--font-afacad)", "sans-serif"],
        holtwood: ["var(--font-holtwood)", "sans-serif"],
        roboto: ["var(--font-roboto)", "sans-serif"],
        geist: ["var(--font-geist-sans)", "sans-serif"],
        geist_mono: ["var(--font-geist-mono)", "sans-serif"],
      },
    },
    containers: {
      sm: "300px",
      md: "400px",
      lg: "600px",
      xl: "800px",
      xxl: "1000px",
    },
  },
  plugins: [require("@tailwindcss/container-queries")],
};
