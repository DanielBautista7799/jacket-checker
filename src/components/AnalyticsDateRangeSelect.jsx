import Select from "./ui/Select";
import Input from "./ui/Input";

export default function AnalyticsDateRangeSelect({ value, onChange, customFrom, customTo, onCustomFromChange, onCustomToChange }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="block min-w-48 text-sm font-bold text-slate-200">
        Date range
        <Select className="mt-2" value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="1">Last 24 hours</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="custom">Custom range</option>
        </Select>
      </label>
      {value === "custom" && (
        <>
          <label className="block text-sm font-bold text-slate-200">From<Input className="mt-2" type="date" value={customFrom} onChange={(event) => onCustomFromChange(event.target.value)} /></label>
          <label className="block text-sm font-bold text-slate-200">To<Input className="mt-2" type="date" value={customTo} onChange={(event) => onCustomToChange(event.target.value)} /></label>
        </>
      )}
    </div>
  );
}
