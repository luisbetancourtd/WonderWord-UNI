import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="noche"]'],
  theme: {
    extend: {
      colors: {
        prune: {
          DEFAULT: 'var(--prune)',
          2: 'var(--prune-2)',
          wash: 'var(--prune-wash)',
        },
        sauge: {
          DEFAULT: 'var(--sauge)',
          2: 'var(--sauge-2)',
          wash: 'var(--sauge-wash)',
        },
        soleil: {
          DEFAULT: 'var(--soleil)',
          ink: 'var(--soleil-ink)',
          wash: 'var(--soleil-wash)',
        },
        terre: {
          DEFAULT: 'var(--terre)',
          ink: 'var(--terre-ink)',
          wash: 'var(--terre-wash)',
        },
        bleuet: {
          DEFAULT: 'var(--bleuet)',
          ink: 'var(--bleuet-ink)',
          wash: 'var(--bleuet-wash)',
        },
        canvas: 'var(--canvas)',
        paper: {
          DEFAULT: 'var(--paper)',
          warm: 'var(--paper-warm)',
          2: 'var(--paper-2)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
        },
        rail: {
          DEFAULT: 'var(--rail)',
          2: 'var(--rail-2)',
          ink: 'var(--rail-ink)',
          'ink-2': 'var(--rail-ink-2)',
          'ink-3': 'var(--rail-ink-3)',
        }
      },
      fontFamily: {
        serif: ['"Libre Caslon Text"', 'Georgia', 'serif'],
        sans: ['"Hanken Grotesk"', 'sans-serif'],
        ipa: ['"Charis SIL"', 'serif'],
      }
    },
  },
  plugins: [],
} satisfies Config
