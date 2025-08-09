import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

export const Tabs = TabsPrimitive.Root

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn("inline-flex items-center bg-surfaceMuted p-1 rounded-pill", className)}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "px-4 h-10 rounded-pill text-sm font-medium text-muted-foreground data-[state=active]:text-text",
      "relative transition-colors data-[state=active]:bg-surface data-[state=active]:shadow-card",
      className
    )}
    {...props}
  >
    <span className="relative z-10">{props.children}</span>
    <span className="pointer-events-none absolute left-2 right-2 -bottom-[2px] h-[2px] rounded-pill bg-primary data-[state=inactive]:opacity-0 data-[state=inactive]:translate-y-1 transition-all" />
  </TabsPrimitive.Trigger>
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

export const TabsContent = TabsPrimitive.Content
