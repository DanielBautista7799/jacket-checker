import { createElement } from "react";
import { Sparkles } from "lucide-react";
import Button from "./Button";
import Card from "./Card";

export default function EmptyState({ icon = Sparkles, title, description, actionLabel, onAction, action }) {
  return (
    <Card className="px-5 py-10 text-center" soft>
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/14 bg-cyan-400/[0.07] text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
        {createElement(icon, { size: 26, "aria-hidden": true })}
      </span>
      <h2 className="font-display mt-5 text-xl font-bold text-white">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">{description}</p>}
      {action || (actionLabel && onAction ? <Button type="button" onClick={onAction} className="mt-5">{actionLabel}</Button> : null)}
    </Card>
  );
}
