import { Clock3 } from "lucide-react";
import { TIME_WINDOWS } from "../utils/timeWindows";

function TimeWindowSelect({ value, onChange }) {
const selectedWindow = TIME_WINDOWS.find(
(window) => window.id === value
);

return (
<div className="space-y-2">
    <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
    <Clock3 size={17} className="text-sky-300" />
    Forecast Window
    </label>

    <select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-white outline-none transition focus:border-sky-500/70 focus:ring-4 focus:ring-sky-500/10"
    >
    {TIME_WINDOWS.map((window) => (
        <option key={window.id} value={window.id}>
        {window.label}
        </option>
    ))}
    </select>

    {selectedWindow && (
    <p className="text-sm text-slate-400">
        {selectedWindow.description}
    </p>
    )}
</div>
);
}

export default TimeWindowSelect;