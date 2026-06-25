import { Clock3 } from "lucide-react";
import { TIME_WINDOWS } from "../utils/timeWindows";
import Select from "./ui/Select";

export default function TimeWindowSelect({ value, onChange }) {
  return (
    <label className="block text-sm font-extrabold text-slate-200">
      Forecast window
      <span className="relative mt-2 block">
        <Clock3 size={17} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-violet-200" aria-hidden="true" />
        <Select value={value} onChange={(event) => onChange(event.target.value)} className="pl-11">
          {TIME_WINDOWS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </Select>
      </span>
    </label>
  );
}
