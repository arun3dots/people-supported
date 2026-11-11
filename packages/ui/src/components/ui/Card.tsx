import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@repo/ui/lib/utils";

const cardVariants = cva(
  "text-text-body flex flex-col gap-6 rounded-2xl transition-all p-6",
  {
    variants: {
      variant: {
        default: "bg-surface-card-grey shadow-none",
        primary:
          "bg-linear-to-br from-surface-primary to-[#0d443e] text-text-action shadow-2xl",
        secondary: "bg-surface-primary-light border-border-secondary/40",
        ghost: "bg-transparent shadow-none",
        surface: "bg-surface-card-grey shadow-none rounded-2xl",
        wizard: "bg-surface-primary-light",
        white: "bg-white shadow-none",
      },
      border: {
        default: "border-none",
        primary: "border border-border-primary",
        secondary: "border border-border-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
      border: "default",
    },
  },
);

interface CardProps
  extends React.ComponentProps<"div">, VariantProps<typeof cardVariants> { }

function Card({ className, variant, border, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(cardVariants({ variant, border }), className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold tracking-tight text-text-heading", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-text-description text-md", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-6 pt-0", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
