import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { TextClassContext, Text } from './text';

export const badgeVariants = cva(
  'inline-flex flex-row items-center rounded-full px-2.5 py-0.5',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-secondary',
        destructive: 'bg-destructive',
        outline: 'border border-border-light bg-background',
        success: 'bg-clinical-safeBg',
        warning: 'bg-clinical-warningBg',
        info: 'bg-clinical-infoBg',
        clinicalSafe: 'bg-clinical-safeBg',
        clinicalWarning: 'bg-clinical-warningBg',
        clinicalCritical: 'bg-clinical-criticalBg',
      },
      size: {
        default: 'px-2.5 py-1',
        sm: 'px-2.5 py-0.5',
        lg: 'px-3.5 py-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export const badgeTextVariants = cva('text-xs font-medium select-none', {
  variants: {
    variant: {
      default: 'text-primary-foreground font-semibold',
      secondary: 'text-secondary-foreground font-medium',
      destructive: 'text-destructive-foreground font-semibold',
      outline: 'text-foreground font-medium',
      success: 'text-clinical-safe font-medium',
      warning: 'text-clinical-warning font-medium',
      info: 'text-clinical-info font-medium',
      clinicalSafe: 'text-clinical-safe font-medium',
      clinicalWarning: 'text-clinical-warning font-medium',
      clinicalCritical: 'text-clinical-critical font-semibold',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps
  extends ViewProps,
    VariantProps<typeof badgeVariants> {
  children?: React.ReactNode;
  className?: string;
  textClassName?: string;
}

export function Badge({
  className,
  textClassName,
  variant = 'default',
  size = 'default',
  children,
  ...props
}: BadgeProps) {
  return (
    <TextClassContext.Provider
      value={cn(badgeTextVariants({ variant }), textClassName)}
    >
      <View
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {React.Children.map(children, (child) =>
          typeof child === 'string' || typeof child === 'number' ? (
            <Text>{child}</Text>
          ) : (
            child
          )
        )}
      </View>
    </TextClassContext.Provider>
  );
}
