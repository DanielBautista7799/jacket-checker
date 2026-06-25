import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "../../lib/utils";

const variants = {
  info: { icon: Info, className: "border-cyan-300/20 bg-cyan-400/[0.065] text-cyan-50" },
  success: { icon: CheckCircle2, className: "border-emerald-300/20 bg-emerald-400/[0.065] text-emerald-50" },
  warning: { icon: TriangleAlert, className: "border-amber-300/20 bg-amber-400/[0.065] text-amber-50" },
  error: { icon: AlertCircle, className: "border-rose-300/20 bg-rose-400/[0.07] text-rose-50" },
};

export default function Alert({ tone = "info", title, children, className = "", role }) {
  const current = variants[tone] || variants.info;
  const Icon = current.icon;
  return (
    <div role={role || (tone === "error" ? "alert" : "status")} className={cn("flex items-start gap-3 rounded-[var(--radius-card)] border p-4 text-sm", current.className, className)}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title && <p className="font-extrabold text-white">{title}</p>}
        <div className={cn("leading-6", title && "mt-1")}>{children}</div>
      </div>
    </div>
  );
}
