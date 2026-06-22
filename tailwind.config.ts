import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        bate: {
          cream: '#f5e9c9',
          paper: '#fff5d1',
          ink: '#1a0e08',
          red: '#d63232',
          'red-deep': '#8b1a1a',
          gold: '#ffb81c',
          green: '#4a7c4f',
          teal: '#2c8a9c',
          silver: '#d3d3d3',
        },
      },
      fontFamily: {
        display: ['var(--font-bowlby)', 'system-ui', 'sans-serif'],
        body: ['var(--font-fredoka)', 'system-ui', 'sans-serif'],
        hand: ['var(--font-caveat)', 'cursive'],
      },
      boxShadow: {
        'hard-sm': '3px 3px 0 #1a0e08',
        'hard': '5px 5px 0 #1a0e08',
        'hard-lg': '6px 7px 0 #1a0e08',
        'hard-red': '5px 5px 0 #d63232',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.23, 1, 0.32, 1)',
        snappy: 'cubic-bezier(0.23, 1, 0.32, 1)',
        smooth: 'cubic-bezier(0.77, 0, 0.175, 1)',
        drawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      zIndex: {
        deco: '5',
        card: '10',
        mid: '20',
        overlay: '30',
        hud: '40',
        float: '50',
        snap: '55',
        penalty: '58',
        banner: '60',
        'global-toast': '100',
        confirm: '110',
        modal: '120',
      },
    },
  },
  plugins: [],
}

export default config
