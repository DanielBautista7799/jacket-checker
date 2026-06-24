import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

const styles = {
  info: { icon: Info, className: "border-sky-400/25 bg-sky-400/10 text-sky-100" },
  success: { icon: CheckCircle2, className: "border-emerald-400/25 bg-emerald-400/10 text-emerald-100" },
  warning: { icon: TriangleAlert, className: "border-amber-400/25 bg-amber-400/10 text-amber-100" },
  error: { icon: AlertCircle, className: "border-red-400/25 bg-red-400/10 text-red-100" },
};

export default function Alert({ tone = "info", title, children, className = "", role }) {
  const config = styles[tone] || styles.info;
  const Icon = config.icon;
  return (
    <div role={role || (tone === "error" ? "alert" : "status")} className={`rounded-2xl border p-4 ${config.className} ${className}`}>
      <div className="flex gap-3">
        <Icon size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          {title && <p className="font-black">{title}</p>}
          <div className={`${title ? "mt-1" : ""} text-sm leading-6`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
