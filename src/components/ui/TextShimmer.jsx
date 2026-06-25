import { createElement } from "react";
import { cn } from "../../lib/utils";

export default function TextShimmer({ as = "span", className = "", children }) {
  return createElement(as, { className: cn("text-shimmer", className) }, children);
}
