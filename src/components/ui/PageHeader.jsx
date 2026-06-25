import { cn } from "../../lib/utils";

export default function PageHeader({ eyebrow, title, description, actions, className = "" }) {
  return (
    <header className={cn("flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-3xl">
        {eyebrow && <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-300/80">{eyebrow}</p>}
        <h1 className="font-display mt-2 text-3xl font-bold tracking-[-0.045em] text-white sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">{description}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
