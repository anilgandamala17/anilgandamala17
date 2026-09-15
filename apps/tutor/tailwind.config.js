/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Primary gradient colors from mockup
                primary: {
                    50: '#faf5ff',
                    100: '#f3e8ff',
                    200: '#e9d5ff',
                    300: '#d8b4fe',
                    400: '#c084fc',
                    500: '#a855f7',
                    600: '#9333ea',
                    700: '#7c3aed',
                    800: '#6b21a8',
                    900: '#581c87',
                },
                // Accent pink
                accent: {
                    50: '#fdf2f8',
                    100: '#fce7f3',
                    200: '#fbcfe8',
                    300: '#f9a8d4',
                    400: '#f472b6',
                    500: '#ec4899',
                    600: '#db2777',
                    700: '#be185d',
                    800: '#9d174d',
                    900: '#831843',
                },
                // Sky blue for gradients
                sky: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                },
                // Surface colors
                surface: {
                    50: '#fefefe',
                    100: '#f8f7ff',
                    200: '#f0eeff',
                    glass: 'rgba(255, 255, 255, 0.15)',
                    'glass-dark': 'rgba(0, 0, 0, 0.1)',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
                display: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-main': 'linear-gradient(135deg, #667eea 0%, #a855f7 25%, #ec4899 50%, #f9a8d4 75%, #7dd3fc 100%)',
                'gradient-soft': 'linear-gradient(180deg, #c7d2fe 0%, #e9d5ff 50%, #fbcfe8 100%)',
                'gradient-card': 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                'glass-lg': '0 25px 50px -12px rgba(31, 38, 135, 0.25)',
                'glow': '0 0 40px rgba(168, 85, 247, 0.4)',
                'glow-sm': '0 0 20px rgba(168, 85, 247, 0.3)',
                'soft': '0 4px 24px -1px rgba(0, 0, 0, 0.08)',
                'panel': '0 4px 24px -2px rgba(120, 100, 160, 0.10), 0 1.5px 8px -1px rgba(120, 100, 160, 0.06)',
                'nav': '0 2px 16px -2px rgba(120, 100, 160, 0.10)',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'float-slow': 'float 8s ease-in-out infinite',
                'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'sparkle': 'sparkle 1.5s ease-in-out infinite',
                'bounce-soft': 'bounce-soft 2s ease-in-out infinite',
                'fade-in': 'fade-in 0.5s ease-out',
                'slide-up': 'slide-up 0.5s ease-out',
                'slide-in-right': 'slide-in-right 0.3s ease-out',
                'gradient-shimmer': 'gradient-shimmer 4s ease-in-out infinite',
                'aurora-drift': 'aurora-drift 18s ease-in-out infinite',
                'aurora-drift-alt': 'aurora-drift-alt 22s ease-in-out infinite',
                'mode-select-pulse': 'mode-select-pulse 0.42s ease-out forwards',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                'pulse-soft': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                'gradient-shimmer': {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                'aurora-drift': {
                    '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
                    '50%': { transform: 'translate(24px, -16px) scale(1.05)' },
                },
                'aurora-drift-alt': {
                    '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
                    '50%': { transform: 'translate(-20px, 20px) scale(1.08)' },
                },
                'mode-select-pulse': {
                    '0%': { transform: 'scaleX(0)', opacity: '1' },
                    '100%': { transform: 'scaleX(1)', opacity: '0.85' },
                },
                sparkle: {
                    '0%, 100%': { opacity: '1', transform: 'scale(1)' },
                    '50%': { opacity: '0.5', transform: 'scale(1.2)' },
                },
                'bounce-soft': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'slide-up': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-in-right': {
                    '0%': { opacity: '0', transform: 'translateX(20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
}
