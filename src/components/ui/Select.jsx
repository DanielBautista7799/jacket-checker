import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const Select = forwardRef(function Select({ className = "", children, ...props }, ref) {
  return (
    <select ref={ref} className={cn("storm-field appearance-none px-4 py-2.5 text-sm", className)} {...props}>
      {children}
    </select>
  );
});

export default Select;
