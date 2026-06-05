/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,html}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        garden: '#2d5a27',
        cream: '#faf9f6',
      },
    },
  },
  plugins: [],
};
