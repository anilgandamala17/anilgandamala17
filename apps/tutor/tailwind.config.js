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
                // AIra brand blue — aligned with landing #1d4ed8
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                },
                // Teal accent — secondary brand (landing accent)
                accent: {
                    50: '#f0fdfa',
                    100: '#ccfbf1',
                    200: '#99f6e4',
                    300: '#5eead4',
                    400: '#2dd4bf',
                    500: '#14b8a6',
                    600: '#0d9488',
                    700: '#0f766e',
                    800: '#115e59',
                    900: '#134e4a',
                },
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
                surface: {
                    50: '#fefefe',
                    100: '#f8fafc',
                    200: '#f1f5f9',
                    glass: 'rgba(255, 255, 255, 0.15)',
                    'glass-dark': 'rgba(0, 0, 0, 0.1)',
                },
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
                display: ['Sora', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                sm: 'var(--radius-sm, 0.5rem)',
                DEFAULT: 'var(--radius-md, 0.75rem)',
                md: 'var(--radius-md, 0.75rem)',
                lg: 'var(--radius-lg, 1rem)',
                xl: 'var(--radius-xl, 1.25rem)',
            },
            boxShadow: {
                sm: 'var(--shadow-sm)',
                DEFAULT: 'var(--shadow-md)',
                md: 'var(--shadow-md)',
                lg: 'var(--shadow-lg)',
                glass: '0 8px 32px 0 rgba(15, 23, 42, 0.08)',
                'glass-lg': '0 25px 50px -12px rgba(15, 23, 42, 0.12)',
                soft: '0 4px 24px -1px rgba(0, 0, 0, 0.08)',
                panel: '0 4px 24px -2px rgba(15, 23, 42, 0.08), 0 1.5px 8px -1px rgba(15, 23, 42, 0.04)',
                nav: '0 2px 16px -2px rgba(15, 23, 42, 0.08)',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-main': 'linear-gradient(135deg, #1d4ed8 0%, #0369a1 50%, #0f766e 100%)',
                'gradient-soft': 'linear-gradient(180deg, #eff6ff 0%, #f0fdfa 100%)',
                'gradient-card': 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
            },
            screens: {
                xs: '480px',
                '3xl': '1920px',
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
