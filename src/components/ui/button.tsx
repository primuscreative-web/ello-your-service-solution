import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#292b25]/20 focus-visible:ring-offset-2 active:scale-[0.98] active:translate-y-0 disabled:pointer-events-none disabled:opacity-45 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_1px_2px_rgba(0,0,0,0.06),0_6px_16px_-4px_rgba(41,43,37,0.25)] hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_8px_rgba(0,0,0,0.08),0_12px_24px_-4px_rgba(41,43,37,0.35)]",
        destructive:
          "border border-rose-200/80 bg-rose-50/80 text-rose-700 shadow-xs hover:-translate-y-0.5 hover:bg-rose-100 hover:border-rose-300 hover:shadow-[0_4px_12px_rgba(225,29,72,0.12)]",
        outline:
          "border border-[#dedfd6] bg-white text-[#51534c] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:border-[#c7c9bc] hover:bg-[#fafaf7] hover:text-[#292b25] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]",
        secondary:
          "bg-[#edf0e5]/80 text-[#586341] border border-[#d6dcce]/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] hover:-translate-y-0.5 hover:bg-[#edf0e5] hover:border-[#c2cbba]",
        ghost:
          "hover:bg-[#edf0e5]/70 text-[#62655b] hover:text-[#292b25]",
        link: "text-primary underline-offset-4 hover:underline",
        brand:
          "bg-[#d0f25a] text-[#242620] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_-4px_rgba(208,242,90,0.5)] hover:-translate-y-0.5 hover:bg-[#d9f76a] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_4px_8px_rgba(0,0,0,0.06),0_14px_28px_-4px_rgba(208,242,90,0.65)]",
        brandDark:
          "bg-[#292b25] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_1px_2px_rgba(0,0,0,0.06),0_6px_16px_-4px_rgba(41,43,37,0.28)] hover:-translate-y-0.5 hover:bg-[#363830] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_8px_rgba(0,0,0,0.08),0_12px_24px_-4px_rgba(41,43,37,0.36)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8.5 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base",
        icon: "h-10 w-10 rounded-xl",
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
