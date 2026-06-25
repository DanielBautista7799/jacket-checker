import { cn } from "../../lib/utils";

const tones = {
  neutral: "border-slate-400/16 bg-white/[0.05] text-slate-300",
  info: "border-cyan-300/18 bg-cyan-400/[0.07] text-cyan-100",
  success: "border-emerald-300/18 bg-emerald-400/[0.08] text-emerald-100",
  warning: "border-amber-300/20 bg-amber-400/[0.08] text-amber-100",
  error: "border-rose-300/20 bg-rose-400/[0.08] text-rose-100",
  purple: "border-violet-300/18 bg-violet-400/[0.08] text-violet-100",
};

export default function Badge({ tone = "neutral", className = "", children, ...props }) {
  return (
    <span className={cn("inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-extrabold leading-none", tones[tone] || tones.neutral, className)} {...props}>
      {children}
    </span>
  );
}
