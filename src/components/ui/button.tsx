import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "gradient-primary text-primary-foreground shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 hover:shadow-lg",
        outline:
          "border border-border bg-card/50 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground shadow-sm",
        secondary:
          "gradient-secondary text-secondary-foreground shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground backdrop-blur-sm",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success text-success-foreground shadow-md hover:bg-success/90 hover:shadow-lg",
        glass: "glass text-foreground hover:bg-card-glass/80 shadow-sm",
        hero: "gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transform hover:scale-[1.05] active:scale-[0.95] px-8 py-3 text-base font-semibold",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base",
        icon: "h-10 w-10",
        hero: "h-14 px-8 py-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };