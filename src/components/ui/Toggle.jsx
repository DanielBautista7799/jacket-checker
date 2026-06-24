export default function Toggle({ checked, onChange, label, description, disabled = false, id }) {
  const inputId = id || `toggle-${String(label).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <label htmlFor={inputId} className={`flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
      <span>
        <span className="block text-sm font-bold text-white">{label}</span>
        {description && <span className="mt-1 block text-sm leading-5 text-slate-400">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange?.(event.target.checked)}
          disabled={disabled}
          className="peer sr-only"
        />
        <span className="h-7 w-12 rounded-full bg-slate-700 transition peer-checked:bg-sky-500 peer-focus-visible:ring-4 peer-focus-visible:ring-sky-400/30" />
        <span className="pointer-events-none absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
