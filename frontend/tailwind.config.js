export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#E8EFEB',
          100: '#C5D8CF',
          200: '#9DC1B0',
          300: '#75AA91',
          400: '#4E9372',
          500: '#2D5A4B',
          600: '#234A3D',
          700: '#1A3A2F',
          800: '#122B22',
          900: '#0A1C15',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};
