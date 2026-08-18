/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#13241f',
        forest: '#174c3c',
        sage: '#dce9e2',
        gold: '#c89b52',
        cream: '#f7f4ed'
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: { soft: '0 18px 50px rgba(19, 36, 31, 0.10)' }
    }
  },
  plugins: []
};
