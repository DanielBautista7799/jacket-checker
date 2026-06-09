import { TIME_WINDOWS } from "../utils/timeWindows";

function TimeWindowSelect({ value, onChange }) {
return (
<div className="space-y-2">
    <label className="block text-sm font-medium text-slate-200">
    Forecast Window
    </label>

    <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-sky-500"
    >
    {TIME_WINDOWS.map((window) => (
        <option key={window.id} value={window.id}>
        {window.label}
        </option>
    ))}
    </select>

    <p className="text-xs text-slate-400">
    Choose how far ahead the jacket recommendation should consider.
    </p>
</div>
);
}

export default TimeWindowSelect;