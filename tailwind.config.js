/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#060F1B', 900: '#0B1B2E', 800: '#11263F', 700: '#193450', 600: '#25496D', 500: '#3B6491', 400: '#6B8DB3', 300: '#9DB5CF' },
        cream: { 50: '#FCF9F1', 100: '#F6EEDC', 200: '#EADFC4', 300: '#D8C9A5', 400: '#B7A67F' },
        gold: { 300: '#F8D27A', 400: '#F5BF4F', 500: '#F2B33D', 600: '#D99A22' },
        signal: { 300: '#7DD3FC', 400: '#38BDF8', 500: '#0EA5E9' },
        coral: '#E4572E',
        good: '#34D399',
        bad: '#F87171',
      },
      fontFamily: {
        sans: ['Inter', '"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        arabic: ['"Noto Naskh Arabic"', 'Amiri', '"Traditional Arabic"', '"Geeza Pro"', 'serif'],
      },
      boxShadow: {
        paper: '0 1px 0 rgba(255,255,255,.55) inset, 0 14px 28px -14px rgba(0,0,0,.65)',
        glow: '0 0 0 1px rgba(245,191,79,.5), 0 10px 30px -10px rgba(245,191,79,.35)',
      },
    },
  },
  plugins: [],
}
