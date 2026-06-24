import { TIME_WINDOWS } from "../utils/timeWindows";
import Select from "./ui/Select";

export default function TimeWindowSelect({ value, onChange }) {
  return (
    <label className="block text-sm font-bold text-slate-200">
      Forecast window
      <Select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2">
        {TIME_WINDOWS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </Select>
    </label>
  );
}
