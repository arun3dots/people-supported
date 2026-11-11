export interface ThemeTokens {
  fonts: {
    regular: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  colors: {
    primary: {
      DEFAULT: string;
      foreground: string;
      dark: string;
      light: string;
      subtle: string;
    };
    secondary: {
      DEFAULT: string;
      foreground: string;
      dark: string;
    };
    background: string;
    foreground: string;
    surface: string;
    card: {
      DEFAULT: string;
      white: string;
      foreground: string;
      subtle: string;
    };
    border: {
      DEFAULT: string;
      light: string;
      subtle: string;
    };
    muted: {
      DEFAULT: string;
      foreground: string;
    };
    destructive: {
      DEFAULT: string;
      foreground: string;
      light: string;
    };
    clinical: {
      safe: string;
      safeBg: string;
      safeBorder: string;
      warning: string;
      warningBg: string;
      warningBorder: string;
      critical: string;
      criticalBg: string;
      criticalBorder: string;
      info: string;
      infoBg: string;
    };
  };
  borderRadius: {
    DEFAULT: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    full: number;
  };
}

export declare const themeTokens: ThemeTokens;
export declare const theme: ThemeTokens;
export default themeTokens;

