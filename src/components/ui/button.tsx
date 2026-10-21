import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border border-cyan-200/50 bg-gradient-to-r from-cyan-300 via-sky-300 to-cyan-200 text-slate-950 shadow-[0_0_22px_-8px_rgba(34,211,238,0.55)] hover:border-cyan-100 hover:shadow-[0_0_30px_-6px_rgba(34,211,238,0.7)]",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-cyan-300/30 bg-slate-950/50 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-cyan-200/70 hover:bg-cyan-300/10 hover:text-cyan-100 hover:shadow-[0_0_20px_-10px_rgba(34,211,238,0.55)]",
        secondary: "border border-violet-300/35 bg-gradient-to-r from-violet-600/90 to-indigo-600/90 text-white shadow-[0_0_22px_-10px_rgba(139,92,246,0.65)] hover:border-violet-200/70 hover:shadow-[0_0_28px_-8px_rgba(139,92,246,0.75)]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glow: "border border-cyan-200/60 bg-gradient-to-r from-cyan-300 via-sky-300 to-cyan-200 text-slate-950 shadow-[0_0_24px_-8px_rgba(34,211,238,0.65)] hover:brightness-110 hover:shadow-[0_0_34px_-5px_rgba(34,211,238,0.8)]",
        whatsapp: "bg-whatsapp text-whatsapp-foreground hover:brightness-110",
        line: "bg-line text-line-foreground hover:brightness-110",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
