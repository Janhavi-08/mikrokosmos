/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#D8B4FE",
          DEFAULT: "#8B5CF6",
          dark: "#5B21B6",
        },
      },
    },
  },
  plugins: [],
};
