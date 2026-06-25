export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_ALLOWED_SYMBOLS = "!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~";

function includesAllowedSymbol(value) {
  return [...value].some((character) =>
    PASSWORD_ALLOWED_SYMBOLS.includes(character),
  );
}

export function getPasswordValidation(password) {
  const value = String(password || "");
  const checks = {
    length: value.length >= PASSWORD_MIN_LENGTH,
    lowercase: /[a-z]/.test(value),
    uppercase: /[A-Z]/.test(value),
    number: /\d/.test(value),
    symbol: includesAllowedSymbol(value),
  };

  return {
    checks,
    valid: Object.values(checks).every(Boolean),
  };
}

export function getPasswordError(password) {
  const { checks, valid } = getPasswordValidation(password);
  if (valid) return "";

  const missing = [];
  if (!checks.length) missing.push(`at least ${PASSWORD_MIN_LENGTH} characters`);
  if (!checks.lowercase) missing.push("a lowercase letter");
  if (!checks.uppercase) missing.push("an uppercase letter");
  if (!checks.number) missing.push("a number");
  if (!checks.symbol) missing.push("a supported symbol");

  return `Use ${missing.join(", ")}.`;
}
