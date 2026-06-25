import { createElement } from "react";
import { cn } from "../../lib/utils";

export default function Card({ as = "section", className = "", elevated = false, soft = false, children, ...props }) {
  const surface = elevated ? "storm-card-elevated" : soft ? "storm-card-soft" : "storm-card";
  return createElement(as, { className: cn(surface, "rounded-[var(--radius-large)]", className), ...props }, children);
}
