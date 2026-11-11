import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';
import { Text, type TextProps } from './text';

export const Card = React.forwardRef<React.ElementRef<typeof View>, ViewProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        'rounded-2xl bg-surface p-4',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<React.ElementRef<typeof View>, ViewProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn('flex-col space-y-1 pb-3', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<React.ElementRef<typeof Text>, TextProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      role="heading"
      aria-level={3}
      className={cn('text-lg font-bold tracking-tight text-foreground', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<React.ElementRef<typeof Text>, TextProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn('text-sm text-muted-foreground leading-relaxed', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<React.ElementRef<typeof View>, ViewProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn('pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<React.ElementRef<typeof View>, ViewProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn('flex-row items-center pt-3 border-t border-border-subtle', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';
