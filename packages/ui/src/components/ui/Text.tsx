
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@repo/ui/lib/utils";
import { forwardRef } from "react";

const textVariants = cva("text-foreground transition-colors", {
  variants: {
    variant: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      subdued: "text-slate-500",
      primary: "text-primary",
      secondary: "text-secondary-foreground",
      destructive: "text-destructive",
      error: "text-red-500",
      success: "text-emerald-600",
      warning: "text-amber-600",
    },
    size: {
      xs: "text-xs xl:text-sm",
      sm: "text-sm xl:text-md",
      base: "text-base xl:text-base",
      md: "text-base xl:text-base",
      lg: "text-lg xl:text-lg",
      xl: "text-xl xl:text-2xl",
      "2xl": "text-2xl xl:text-3xl",
      "3xl": "text-3xl xl:text-4xl",
      "4xl": "text-4xl xl:text-5xl",
      "5xl": "text-5xl xl:text-6xl",
    },
    weight: {
      normal: "font-normal",
      regular: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
      italic: "italic font-normal",
    },
    subdued: {
      true: "text-slate-500",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "base",
    weight: "normal",
    subdued: false,
  },
});

type KnownVariant =
  | "default"
  | "muted"
  | "subdued"
  | "primary"
  | "secondary"
  | "destructive"
  | "error"
  | "success"
  | "warning";

export type TextSize = NonNullable<VariantProps<typeof textVariants>["size"]>;

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
  Omit<VariantProps<typeof textVariants>, "variant"> {
  as?: React.ElementType;
  asChild?: boolean;
  variant?: KnownVariant | (string & {});
  subdued?: boolean;
}

export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  (
    {
      className,
      variant,
      size,
      weight,
      subdued = false,
      as: Component = "p",
      asChild = false,
      ...props
    },
    ref
  ) => {
    let effectiveVariant = variant;
    let effectiveSize = size;
    let effectiveWeight = weight;

    const knownVariants = [
      "default",
      "muted",
      "subdued",
      "primary",
      "secondary",
      "destructive",
      "error",
      "success",
      "warning",
    ];

    if (
      typeof variant === "string" &&
      variant.includes("-") &&
      !knownVariants.includes(variant)
    ) {
      const [s, w] = variant.split("-");
      if (s) effectiveSize = effectiveSize || (s as TextSize);
      if (w) effectiveWeight = effectiveWeight || (w as TextProps["weight"]);
      effectiveVariant = "default";
    }

    const Comp = asChild ? Slot.Root : Component;

    return (
      <Comp
        ref={ref}
        className={cn(
          textVariants({
            variant: effectiveVariant as KnownVariant,
            size: effectiveSize,
            weight: effectiveWeight,
            subdued,
          }),
          className
        )}
        {...props}
      />
    );
  }
);

Text.displayName = "Text";

export { textVariants };
