const { themeTokens } = require('./src/theme/tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit_400Regular', 'Outfit', 'System'],
        medium: ['Outfit_500Medium', 'Outfit', 'System'],
        semibold: ['Outfit_600SemiBold', 'Outfit', 'System'],
        bold: ['Outfit_700Bold', 'Outfit', 'System'],
      },
      fontSize: {
        xs: ['11px', { lineHeight: '16px' }],
        sm: ['12px', { lineHeight: '18px' }],
        md: ['14px', { lineHeight: '20px' }],
        base: ['14px', { lineHeight: '20px' }],
        lg: ['18px', { lineHeight: '24px' }],
        xl: ['22px', { lineHeight: '28px' }],
        '2xl': ['26px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
      },
      colors: {
        primary: themeTokens.colors.primary,
        secondary: themeTokens.colors.secondary,
        background: themeTokens.colors.background,
        foreground: themeTokens.colors.foreground,
        surface: themeTokens.colors.surface,
        card: themeTokens.colors.card,
        border: themeTokens.colors.border,
        muted: themeTokens.colors.muted,
        destructive: themeTokens.colors.destructive,
        clinical: themeTokens.colors.clinical,
      },
      borderRadius: {
        DEFAULT: '12px',
        sm: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
        full: '9999px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
