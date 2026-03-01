/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'burgundy-dark': '#722F37',
        'burgundy-medium': '#8B4049',
        'burgundy-light': '#C4989E',
        'gold': '#D4AF37',
        'gold-light': '#E8D4A0',
        'cream': '#FAF9F6',
        'cream-dark': '#F0EDE6',
        'black-wine': '#2C1810',
        'gray-dark': '#6B5D56',
        'gray-light': '#D1CBC4',
        'success': '#2E7D32',
        'warning': '#F57C00',
        'danger': '#C62828',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
    },
  },
  plugins: [],
}
