/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#c8a96e',
        'gold-dark': '#6b5830',
        'bg-main': '#03030a',
        'bg-s1': '#06060f',
        'bg-s2': '#09091a',
        'bg-card': '#07070e',
      },
      fontFamily: {
        cormorant: ['Cormorant Garamond', 'Georgia', 'serif'],
        outfit: ['Outfit', 'Helvetica', 'sans-serif'],
        mono: ['DM Mono', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
