const tones = {
  neutral: "border-white/10 bg-white/[0.06] text-slate-200",
  info: "border-sky-400/20 bg-sky-400/10 text-sky-100",
  success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  warning: "border-amber-400/20 bg-amber-400/10 text-amber-100",
  danger: "border-red-400/20 bg-red-400/10 text-red-100",
  purple: "border-violet-400/20 bg-violet-400/10 text-violet-100",
};

export default function Badge({ tone = "neutral", className = "", children }) {
  return <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${tones[tone] || tones.neutral} ${className}`}>{children}</span>;
}
