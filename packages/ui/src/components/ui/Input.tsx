import * as React from 'react';
import { cn } from '@repo/ui/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  errorMessage?: string;
}
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, placeholder, errorMessage, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <>
        <input
          ref={ref}
          type={type}
          data-slot="input"
          placeholder={placeholder}
          suppressHydrationWarning
          className={cn(
            "flex h-[44px] w-full rounded-md border border-border-secondary bg-surface-neutral px-3 text-md text-text-body placeholder:text-text-description/50 outline-none focus-visible:outline-none focus-visible:border-border-primary focus-visible:ring-1 focus-visible:ring-surface-primary/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            Boolean(errorMessage) && "border-border-error focus-visible:border-border-error focus-visible:ring-border-error/20",
            className,
          )}
          {...props}
          onChange={handleChange}
        />

        <p
          data-slot="input-error"
          className={cn(
            "text-md text-text-error font-normal min-h-[18px] leading-tight transition-opacity duration-200 mt-1",
            errorMessage
              ? "opacity-100 visible"
              : "opacity-0 invisible pointer-events-none select-none"
          )}
        >
          {errorMessage || "\u00A0"}
        </p>
      </>
    );
  },
);
Input.displayName = 'Input';

export { Input };