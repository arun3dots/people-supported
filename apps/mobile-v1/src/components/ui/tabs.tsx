import * as React from 'react';
import * as TabsPrimitive from '@rn-primitives/tabs';
import { cn } from '@/lib/utils';
import { TextClassContext } from './text';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'flex-row items-center justify-center rounded-md bg-muted p-1',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const { value } = TabsPrimitive.useRootContext();
  const isSelected = value === props.value;

  return (
    <TextClassContext.Provider
      value={cn(
        'text-sm font-semibold',
        isSelected ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
          'flex-1 flex-row items-center justify-center rounded-md px-3 py-2',
          isSelected && 'bg-background',
          className
        )}
        {...props}
      />
    </TextClassContext.Provider>
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('pt-3', className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
