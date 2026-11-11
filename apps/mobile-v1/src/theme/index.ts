// @ts-ignore - tokens.js is CommonJS consumed by tailwind.config.js and TypeScript
import { themeTokens } from './tokens';

export const theme = themeTokens;
export { themeTokens };
export default themeTokens;

export type Theme = typeof themeTokens;
export type ThemeColors = typeof themeTokens.colors;
