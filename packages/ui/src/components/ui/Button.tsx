import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@repo/ui/lib/utils";

const buttonVariants = cva(
  "cursor-pointer flex gap-2 inline-flex items-center justify-center rounded-xl whitespace-nowrap shrink-0 text-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 text-white",
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-red-500 hover:bg-red-500/90 text-white",
        outline:
          "border-primary/500 border-2 bg-background hover:bg-accent hover:text-accent-foreground border text-primary",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-full",
        link: "text-primary underline-offset-4 hover:underline",
        circle:
          "rounded-full font-bold text-md transition-all shrink-0 border border-border-secondary bg-white text-text-body z-10 relative hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-surface-primary",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        circle: "size-8 p-0 rounded-full flex items-center justify-center",
        "circle-sm": "size-7 p-0 rounded-full flex items-center justify-center text-md",
        "circle-lg": "size-10 p-0 rounded-full flex items-center justify-center text-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      suppressHydrationWarning
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
export { Button, buttonVariants };