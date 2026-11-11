import * as React from 'react';
import { TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { cn } from '@/lib/utils';
import { resolveOutfitTypography } from './text';

export interface InputProps extends TextInputProps {
  className?: string;
  hasError?: boolean;
}

export const Input = React.forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  ({ className, style, hasError = false, placeholderTextColor = '#8E8E93', ...props }, ref) => {
    const merged = cn(
      'h-12 w-full rounded-xl border border-border-light bg-card-white px-3.5 py-2 text-base text-foreground font-normal',
      'focus:border-primary',
      hasError && 'border-destructive focus:border-destructive',
      className
    );
    const { fontFamily, cleanedClassName } = resolveOutfitTypography(merged);
    const flattened = style ? StyleSheet.flatten(style) : undefined;

    return (
      <TextInput
        ref={ref}
        placeholderTextColor={placeholderTextColor}
        className={cleanedClassName}
        style={[{ fontFamily }, flattened]}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
