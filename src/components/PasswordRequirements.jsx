import { Check, Circle } from "lucide-react";
import { PASSWORD_MIN_LENGTH, getPasswordValidation } from "../utils/passwordPolicy";

const items = [
  ["length", `${PASSWORD_MIN_LENGTH}+ characters`],
  ["uppercase", "Uppercase letter"],
  ["lowercase", "Lowercase letter"],
  ["number", "Number"],
  ["symbol", "Symbol"],
];

export default function PasswordRequirements({ password }) {
  const { checks } = getPasswordValidation(password);

  return (
    <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2" aria-label="Password requirements">
      {items.map(([key, label]) => {
        const passed = checks[key];
        const Icon = passed ? Check : Circle;
        return (
          <span key={key} className={`inline-flex items-center gap-2 ${passed ? "text-emerald-300" : "text-slate-500"}`}>
            <Icon size={13} aria-hidden="true" />
            {label}
          </span>
        );
      })}
    </div>
  );
}
