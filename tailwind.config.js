/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html"],
  theme: {
    extend: {
      colors: {
        navy: '#0033A0',
        navydeep: '#00256E',
        scarlet: '#D3222A',
        scarletdeep: '#A81A20',
        cream: '#FFFFFF',
        creamdeep: '#F2F4F8',
        line: '#DDE2EA',
      },
      fontFamily: {
        display: ['"Chakra Petch"', 'sans-serif'],
        mono: ['"Geist Mono"', 'monospace'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
