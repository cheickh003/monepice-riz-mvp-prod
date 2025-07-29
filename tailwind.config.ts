import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './utils/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
    './providers/**/*.{js,ts,jsx,tsx,mdx}',
    './layouts/**/*.{js,ts,jsx,tsx,mdx}',
    './ui/**/*.{js,ts,jsx,tsx,mdx}',
    './*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs principales basées sur le logo MonEpice&Riz
        primary: {
          DEFAULT: '#D32F2F', // Rouge MonEpice
          50: '#FEE5E5',
          100: '#FCCACA',
          200: '#F99595',
          300: '#F56161',
          400: '#ED3333',
          500: '#D32F2F',
          600: '#B52626',
          700: '#8A1D1D',
          800: '#5E1414',
          900: '#330A0A',
        },
        secondary: {
          DEFAULT: '#8B4513', // Marron épices
          50: '#FAF0E8',
          100: '#F5E1D1',
          200: '#EBC3A3',
          300: '#E0A576',
          400: '#D68748',
          500: '#8B4513',
          600: '#7A3C11',
          700: '#5D2E0D',
          800: '#401F09',
          900: '#231105',
        },
        accent: {
          DEFAULT: '#FFD700', // Jaune riz
          50: '#FFFEF5',
          100: '#FFFDE6',
          200: '#FFFACC',
          300: '#FFF7B3',
          400: '#FFF499',
          500: '#FFD700',
          600: '#E6C200',
          700: '#B39600',
          800: '#806B00',
          900: '#4D4000',
        },
        tertiary: {
          DEFAULT: '#FFA500', // Orange gradient
          50: '#FFF5E6',
          100: '#FFEBCC',
          200: '#FFD799',
          300: '#FFC266',
          400: '#FFAE33',
          500: '#FFA500',
          600: '#E69500',
          700: '#B37400',
          800: '#805300',
          900: '#4D3200',
        },
        // Couleurs neutres
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // Couleurs sémantiques
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fadeIn 0.3s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'scroll': 'scroll 20s linear infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      screens: {
        'xs': '475px',
        '3xl': '1920px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'drawer': '-4px 0 16px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}
export default config
