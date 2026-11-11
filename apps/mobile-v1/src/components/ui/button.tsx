import * as React from 'react';
import {
  Pressable,
  ActivityIndicator,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { theme } from '../../theme';
import { cn } from '@/lib/utils';
import { TextClassContext, Text } from './text';

export const buttonVariants = cva(
  'group flex-row items-center justify-center rounded-xl active:opacity-85 disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary active:opacity-90',
        destructive: 'bg-destructive active:opacity-90',
        softDestructive: 'bg-clinical-criticalBg active:opacity-85',
        outline: 'border border-border bg-background active:bg-secondary',
        secondary: 'bg-secondary active:opacity-85',
        ghost: 'bg-transparent active:bg-secondary',
        link: 'bg-transparent underline',
        clinical: 'bg-primary active:opacity-90',
      },
      size: {
        default: 'h-12 px-5 py-2.5',
        sm: 'h-9 px-3.5 py-1.5 rounded-full',
        lg: 'h-14 px-7 py-3 rounded-xl',
        icon: 'h-11 w-11 p-0 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export const buttonTextVariants = cva('text-base font-semibold text-center select-none', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      destructive: 'text-destructive-foreground',
      softDestructive: 'text-clinical-critical font-semibold',
      outline: 'text-foreground group-active:text-foreground',
      secondary: 'text-secondary-foreground',
      ghost: 'text-foreground',
      link: 'text-primary underline',
      clinical: 'text-white',
    },
    size: {
      default: 'text-base font-semibold',
      sm: 'text-sm font-semibold',
      lg: 'text-base font-bold',
      icon: 'text-base',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof Pressable>,
    VariantProps<typeof buttonVariants> {
  children?: React.ReactNode;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  textClassName?: string;
}

function renderButtonChildren(children: React.ReactNode) {
  if (children === null || children === undefined || typeof children === 'boolean') {
    return null;
  }
  if (React.isValidElement(children)) {
    return children;
  }
  if (Array.isArray(children)) {
    const hasPrimitive = children.some(
      (c) => typeof c === 'string' || typeof c === 'number'
    );
    if (hasPrimitive) {
      return <Text>{children}</Text>;
    }
    return children;
  }
  return <Text>{children}</Text>;
}

export const Button = React.forwardRef<React.ElementRef<typeof View>, ButtonProps>(
  (
    {
      className,
      textClassName,
      variant = 'default',
      size = 'default',
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      children,
      onPress,
      ...props
    },
    ref
  ) => {
    const isInteractiveDisabled = disabled || loading;

    const handlePress = (e: GestureResponderEvent) => {
      if (isInteractiveDisabled) return;
      onPress?.(e);
    };

    return (
      <TextClassContext.Provider
        value={cn(buttonTextVariants({ variant, size }), textClassName)}
      >
        <Pressable
          ref={ref}
          role="button"
          disabled={isInteractiveDisabled}
          onPress={handlePress}
          className={cn(buttonVariants({ variant, size }), className)}
          {...props}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={
                variant === 'outline' || variant === 'secondary' || variant === 'ghost'
                  ? theme.colors.primary.DEFAULT
                  : variant === 'softDestructive'
                    ? theme.colors.clinical.critical
                    : '#FFFFFF'
              }
            />
          ) : (
            <View className="flex-row items-center justify-center gap-2">
              {leftIcon}
              {renderButtonChildren(children)}
              {rightIcon}
            </View>
          )}
        </Pressable>
      </TextClassContext.Provider>
    );
  }
);

Button.displayName = 'Button';
