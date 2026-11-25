import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '1.5rem' },
    extend: {
      colors: {
        ivory: { DEFAULT: '#FAF7F2', 50: '#FDFCF9', 100: '#FAF7F2', 200: '#F3EEE5' },
        charcoal: { DEFAULT: '#2B2B2B', 50: '#6B6866', 100: '#4A4745', 900: '#1E1E1E' },
        beige: { DEFAULT: '#E8DFD3', 100: '#F1EBE2', 300: '#D9CCBB', 500: '#BFAE97' },
        gold: { DEFAULT: '#B8975A', 100: '#F3ECDD', 300: '#D4BC8C', 600: '#9A7B43', 700: '#7D6334' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
      },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        display: ['"Noto Naskh Arabic"', '"Cormorant Garamond"', 'serif'],
      },
      boxShadow: { soft: '0 1px 2px rgba(43,43,43,0.04), 0 8px 24px -12px rgba(43,43,43,0.12)' },
    },
  },
  plugins: [animate],
} satisfies Config;
