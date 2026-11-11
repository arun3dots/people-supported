import * as React from 'react';
import * as ProgressPrimitive from '@rn-primitives/progress';
import { cn } from '@/lib/utils';

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    indicatorClassName?: string;
  }
>(({ className, value, indicatorClassName, ...props }, ref) => {
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        'relative h-3 w-full overflow-hidden rounded-full bg-secondary',
        className
      )}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn('h-full bg-primary', indicatorClassName)}
        style={{ width: `${Math.min(Math.max(value || 0, 0), 100)}%` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
