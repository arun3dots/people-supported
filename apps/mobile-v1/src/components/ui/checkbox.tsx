import * as React from 'react';
import * as CheckboxPrimitive from '@rn-primitives/checkbox';
import { Check } from 'lucide-react-native';
import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, checked, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'h-6 w-6 shrink-0 rounded-md border-2 border-primary items-center justify-center bg-background',
      checked && 'bg-primary border-primary',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    checked={checked}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="items-center justify-center">
      <Check size={16} color="#FFFFFF" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
