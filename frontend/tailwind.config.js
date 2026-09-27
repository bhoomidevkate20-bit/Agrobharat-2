/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FBF7EE',
        husk: '#EDE6D6',
        leaf: {
          DEFAULT: '#2F5233',
          dark: '#1F3A22',
          light: '#4A7150'
        },
        turmeric: '#E3A008',
        soil: '#6B4226',
        ink: '#1F2A1F',
        rust: '#B3452C'
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Work Sans"', 'sans-serif']
      }
    }
  },
  plugins: []
}
