/**
 * SINGLE POINT OF TRUTH: Theme & Design Tokens
 * Synced with packages/ui/src/globals.css & Cantra Care Mobile Design System.
 */

const themeTokens = {
  fonts: {
    regular: 'Outfit_400Regular',
    medium: 'Outfit_500Medium',
    semibold: 'Outfit_600SemiBold',
    bold: 'Outfit_700Bold',
  },
  colors: {
    primary: {
      DEFAULT: '#4A706A',
      foreground: '#FFFFFF',
      dark: '#324D49',
      light: '#F5F8F7',
      subtle: '#E4ECEA',
    },
    secondary: {
      DEFAULT: '#F5F8F7',
      foreground: '#4A706A',
      dark: '#E4ECEA',
    },
    background: '#FFFFFF',
    foreground: '#141F1E',
    surface: '#F7F7F7',
    card: {
      DEFAULT: '#F7F7F7',
      white: '#FFFFFF',
      foreground: '#141F1E',
      subtle: '#FAF7EC',
    },
    border: {
      DEFAULT: '#BCD3CD',
      light: '#E4ECEA',
      subtle: '#F0F4F3',
    },
    muted: {
      DEFAULT: '#F5F8F7',
      foreground: '#5D5D5D',
    },
    destructive: {
      DEFAULT: '#FF3B2F',
      foreground: '#FFFFFF',
      light: '#FFF2F1',
    },
    clinical: {
      safe: '#1D5E2E',
      safeBg: '#E6F4EA',
      safeBorder: '#BCD3CD',
      warning: '#C38C0B',
      warningBg: '#FDFBE9',
      warningBorder: '#F2EEDA',
      critical: '#FF3B2F',
      criticalBg: '#FFF2F1',
      criticalBorder: '#FECDCA',
      info: '#3294FF',
      infoBg: '#EEF8FF',
    },
  },
  borderRadius: {
    DEFAULT: 12,
    sm: 8,
    md: 10,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
  },
};

module.exports = { themeTokens, theme: themeTokens, default: themeTokens };
