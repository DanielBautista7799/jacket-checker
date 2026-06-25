import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const Input = forwardRef(function Input({ className = "", ...props }, ref) {
  return <input ref={ref} className={cn("storm-field px-4 py-2.5 text-sm", className)} {...props} />;
});

export default Input;
