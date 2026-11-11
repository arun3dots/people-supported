import * as React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { cn } from '@/lib/utils';

export const TextClassContext = React.createContext<string | undefined>(undefined);

export interface TextProps extends React.ComponentPropsWithoutRef<typeof RNText> {
  className?: string;
}

const WEIGHT_FAMILY_MAP: Record<string, string> = {
  'font-normal': 'Outfit_400Regular',
  'font-regular': 'Outfit_400Regular',
  'font-medium': 'Outfit_500Medium',
  'font-semibold': 'Outfit_600SemiBold',
  'font-bold': 'Outfit_700Bold',
  'font-extrabold': 'Outfit_700Bold',
};

export function resolveOutfitTypography(mergedClassName: string): {
  fontFamily: string;
  cleanedClassName: string;
} {
  let fontFamily = 'Outfit_400Regular';
  const tokens = mergedClassName.trim().split(/\s+/);
  const kept: string[] = [];

  for (const token of tokens) {
    if (token in WEIGHT_FAMILY_MAP) {
      fontFamily = WEIGHT_FAMILY_MAP[token];
    } else {
      kept.push(token);
    }
  }

  return {
    fontFamily,
    cleanedClassName: kept.join(' '),
  };
}

export const Text = React.forwardRef<React.ElementRef<typeof RNText>, TextProps>(
  ({ className, style, ...props }, ref) => {
    const textClass = React.useContext(TextClassContext);
    const merged = cn('text-base text-foreground font-normal', textClass, className);
    const { fontFamily, cleanedClassName } = resolveOutfitTypography(merged);
    const flattened = style ? StyleSheet.flatten(style) : undefined;

    return (
      <RNText
        ref={ref}
        className={cleanedClassName}
        style={[{ fontFamily }, flattened]}
        {...props}
      />
    );
  }
);

Text.displayName = 'Text';
