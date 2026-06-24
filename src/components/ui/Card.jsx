export default function Card({
  as = "div",
  className = "",
  children,
  elevated = false,
  ...props
}) {
  const Tag = as;
  return (
    <Tag
      className={`rounded-3xl border border-white/10 bg-slate-950/60 ${elevated ? "shadow-2xl shadow-black/20" : ""} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
