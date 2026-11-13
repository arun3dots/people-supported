"use client";

import type { ComponentProps, ComponentPropsWithoutRef, ReactElement } from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";

import { cn } from "@repo/ui/lib/utils";

function ToastProvider({
  ...props
}: ComponentProps<typeof ToastPrimitives.Provider>) {
  return <ToastPrimitives.Provider {...props} />;
}

function ToastViewport({
  className,
  ...props
}: ComponentProps<typeof ToastPrimitives.Viewport>) {
  return (
    <ToastPrimitives.Viewport
      data-slot="toast-viewport"
      className={cn(
        "fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col items-end gap-2 p-4 sm:max-w-[420px]",
        className,
      )}
      {...props}
    />
  );
}

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-top-full",
  {
    variants: {
      variant: {
        default:
          "border bg-background text-foreground bg-white shadow",
        destructive:
          "border bg-background text-foreground bg-white shadow",
        success: "border border-slate-200 bg-white shadow text-slate-950",
        error: "border border-slate-200 bg-white shadow text-slate-950",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Toast({
  className,
  variant,
  ...props
}: ComponentProps<typeof ToastPrimitives.Root> &
  VariantProps<typeof toastVariants>) {
  return (
    <ToastPrimitives.Root
      data-slot="toast"
      data-variant={variant}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
}

function ToastAction({
  className,
  ...props
}: ComponentProps<typeof ToastPrimitives.Action>) {
  return (
    <ToastPrimitives.Action
      data-slot="toast-action"
      className={cn(
        "focus:ring-ring inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-md font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function ToastClose({
  className,
  ...props
}: ComponentProps<typeof ToastPrimitives.Close>) {
  return (
    <ToastPrimitives.Close
      data-slot="toast-close"
      className={cn(
        "text-foreground/50 hover:text-foreground absolute right-1 top-1 rounded-md p-1 opacity-0 transition-opacity focus:opacity-100 focus:outline-none focus:ring-1 group-hover:opacity-100",
        className,
      )}
      toast-close=""
      {...props}
    >
      <XIcon className="size-4" />
    </ToastPrimitives.Close>
  );
}

function ToastTitle({
  className,
  ...props
}: ComponentProps<typeof ToastPrimitives.Title>) {
  return (
    <ToastPrimitives.Title
      data-slot="toast-title"
      className={cn("text-md font-semibold [&+div]:text-md", className)}
      {...props}
    />
  );
}

function ToastDescription({
  className,
  ...props
}: ComponentProps<typeof ToastPrimitives.Description>) {
  return (
    <ToastPrimitives.Description
      data-slot="toast-description"
      className={cn("text-md opacity-90", className)}
      {...props}
    />
  );
}

type ToastProps = ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
