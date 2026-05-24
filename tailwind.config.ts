import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cabo: {
          bg: '#0d1b2a',
          surface: '#1b3050',
          accent: '#ff6b35',
          gold: '#ffd23f',
          purple: '#7c5db8',
          felt: '#1d4d35',
          red: '#c8102e',
          cream: '#fdf6e3',
          success: '#06d6a0',
          danger: '#ef476f',
        },
      },
      fontFamily: {
        display: ['var(--font-fredoka)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
