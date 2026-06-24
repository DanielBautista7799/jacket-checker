import { forwardRef } from "react";

const Select = forwardRef(function Select({ className = "", invalid = false, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`min-h-12 w-full rounded-2xl border bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:ring-4 ${invalid ? "border-red-400/60 focus:border-red-400 focus:ring-red-400/10" : "border-white/10 focus:border-sky-400/70 focus:ring-sky-400/10"} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});

export default Select;
