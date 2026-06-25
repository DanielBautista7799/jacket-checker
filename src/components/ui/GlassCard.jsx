import { createElement } from "react";
import { cn } from "../../lib/utils";

export default function GlassCard({ as = "div", className = "", children, ...props }) {
  return createElement(
    as,
    { className: cn("glass-nav rounded-[var(--radius-large)]", className), ...props },
    children
  );
}
