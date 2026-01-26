import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary hover:shadow-float hover:-translate-y-0.5",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-soft hover:shadow-float hover:-translate-y-0.5",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary hover:shadow-float hover:-translate-y-1 active:translate-y-0",
        trust: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-soft hover:shadow-float hover:-translate-y-1",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-soft hover:-translate-y-0.5",
        hero: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary hover:shadow-float hover:-translate-y-1 text-base px-8 py-4 rounded-2xl font-bold",
        heroOutline: "border-2 border-primary text-primary bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground text-base px-8 py-4 rounded-2xl font-bold hover:-translate-y-1 transition-all duration-300",
        gentle: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        success: "bg-success text-primary-foreground hover:bg-success/90 shadow-soft hover:-translate-y-0.5",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-4",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };