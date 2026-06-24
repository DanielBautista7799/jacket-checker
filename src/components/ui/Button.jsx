import { forwardRef } from "react";

const variants = {
  primary: "bg-sky-500 text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400",
  success: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400",
  secondary: "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]",
  ghost: "text-slate-300 hover:bg-white/[0.07] hover:text-white",
  danger: "border border-red-400/30 bg-red-500/10 text-red-100 hover:bg-red-500/20",
};

const sizes = {
  sm: "min-h-10 px-3 py-2 text-sm",
  md: "min-h-11 px-4 py-3 text-sm",
  lg: "min-h-13 px-5 py-4 text-base",
};

const Button = forwardRef(function Button(
  {
    as: Component = "button",
    variant = "primary",
    size = "md",
    className = "",
    loading = false,
    disabled,
    children,
    ...props
  },
  ref
) {
  return (
    <Component
      ref={ref}
      disabled={Component === "button" ? disabled || loading : undefined}
      aria-disabled={disabled || loading || undefined}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/30 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
});

export default Button;
