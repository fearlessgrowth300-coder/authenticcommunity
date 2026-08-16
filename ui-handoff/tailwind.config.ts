import type { Config } from 'tailwindcss'
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          500: '#4F46E5',
          600: '#4338CA',
          coral: '#F9736B',
          sage: '#3BAA7A',
          amber: '#F6B94A',
          ink: '#172033',
          muted: '#64748B',
          canvas: '#F8FAFC',
          line: '#E2E8F0'
        }
      },
      borderRadius: { '4xl': '2rem' },
      boxShadow: { soft: '0 12px 40px rgba(23,32,51,.08)' }
    }
  },
  plugins: []
} satisfies Config
