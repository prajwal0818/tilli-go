/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--color-primary) / <alpha-value>)',
          hover: 'hsl(var(--color-primary-hover) / <alpha-value>)',
          light: 'hsl(var(--color-primary-light) / <alpha-value>)',
          muted: 'hsl(var(--color-primary-muted) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--color-accent) / <alpha-value>)',
          light: 'hsl(var(--color-accent-light) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--color-destructive) / <alpha-value>)',
          light: 'hsl(var(--color-destructive-light) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'hsl(var(--color-surface) / <alpha-value>)',
          alt: 'hsl(var(--color-surface-alt) / <alpha-value>)',
          hover: 'hsl(var(--color-surface-hover) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'hsl(var(--color-border) / <alpha-value>)',
          strong: 'hsl(var(--color-border-strong) / <alpha-value>)',
        },
        'text-primary': 'hsl(var(--color-text-primary) / <alpha-value>)',
        'text-secondary': 'hsl(var(--color-text-secondary) / <alpha-value>)',
        'text-muted': 'hsl(var(--color-text-muted) / <alpha-value>)',
      },
      borderRadius: {
        card: '0.75rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.08)',
        'card-lg': '0 8px 24px 0 rgb(0 0 0 / 0.1)',
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};
