import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

const tones = {
  error: {
    container: "border-rose-400/25 bg-rose-950/30 text-rose-100",
    icon: AlertCircle,
    iconClass: "text-rose-300",
  },
  success: {
    container: "border-emerald-400/25 bg-emerald-950/25 text-emerald-100",
    icon: CheckCircle2,
    iconClass: "text-emerald-300",
  },
  warning: {
    container: "border-amber-400/25 bg-amber-950/25 text-amber-100",
    icon: TriangleAlert,
    iconClass: "text-amber-300",
  },
  info: {
    container: "border-sky-400/25 bg-sky-950/25 text-sky-100",
    icon: Info,
    iconClass: "text-sky-300",
  },
};

export default function Alert({
  tone = "info",
  title = "",
  children,
  className = "",
}) {
  const selected = tones[tone] || tones.info;
  const Icon = selected.icon;
  const liveRole = tone === "error" ? "alert" : "status";

  return (
    <div
      role={liveRole}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`rounded-2xl border p-4 ${selected.container} ${className}`}
    >
      <div className="flex items-start gap-3">
        <Icon
          size={19}
          className={`mt-0.5 shrink-0 ${selected.iconClass}`}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          {title && <p className="font-black text-white">{title}</p>}
          <div className={`${title ? "mt-1" : ""} text-sm leading-6`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
