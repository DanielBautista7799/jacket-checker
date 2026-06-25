import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";
import Spinner from "./Spinner";

const buttonVariants = cva(
  "inline-flex min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] font-extrabold tracking-[-0.01em] transition duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 active:scale-[0.985]",
  {
    variants: {
      variant: {
        primary: "storm-primary-action",
        success: "border border-emerald-300/20 bg-emerald-400 text-emerald-950 shadow-[0_14px_36px_rgba(52,211,153,0.18)] hover:bg-emerald-300",
        secondary: "border border-slate-400/16 bg-white/[0.055] text-slate-100 shadow-sm hover:border-slate-300/25 hover:bg-white/[0.09]",
        ghost: "border border-transparent bg-transparent text-slate-300 hover:bg-white/[0.06] hover:text-white",
        danger: "border border-rose-400/28 bg-rose-400/10 text-rose-100 hover:bg-rose-400/18",
      },
      size: {
        sm: "min-h-10 px-3.5 py-2 text-sm",
        md: "min-h-11 px-4 py-2.5 text-sm",
        lg: "min-h-[3.25rem] px-5 py-3.5 text-base",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

const Button = forwardRef(function Button(
  { as, asChild = false, variant = "primary", size = "md", className = "", loading = false, loadingLabel = "Loading", disabled, children, ...props },
  ref
) {
  const Component = asChild ? Slot : as || "button";
  const isNativeButton = Component === "button";
  return (
    <Component
      ref={ref}
      disabled={isNativeButton ? disabled || loading : undefined}
      aria-disabled={disabled || loading || undefined}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading && <Spinner size={17} label={loadingLabel} />}
      {children}
    </Component>
  );
});

export default Button;
