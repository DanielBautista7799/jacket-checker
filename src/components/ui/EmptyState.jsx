export default function EmptyState({ icon: Icon, title, description, action, className = "" }) {
  return (
    <div className={`rounded-3xl border border-dashed border-white/15 bg-white/[0.025] p-8 text-center ${className}`}>
      {Icon && <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.07] text-slate-300"><Icon size={23} aria-hidden="true" /></div>}
      <h2 className="mt-4 text-xl font-black text-white">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
