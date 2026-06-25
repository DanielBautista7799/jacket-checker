import { SafeHttpError } from "./safeError.ts";

export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 256;
export const PASSWORD_ALLOWED_SYMBOLS = "!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~";

function includesAllowedSymbol(value: string): boolean {
  return [...value].some((character) =>
    PASSWORD_ALLOWED_SYMBOLS.includes(character)
  );
}

export function validatePassword(value: unknown): string {
  if (typeof value !== "string") {
    throw new SafeHttpError(
      400,
      "invalid_password",
      "Enter a valid password.",
    );
  }

  if (value.length > PASSWORD_MAX_LENGTH) {
    throw new SafeHttpError(
      400,
      "invalid_password",
      `Passwords cannot exceed ${PASSWORD_MAX_LENGTH} characters.`,
    );
  }

  const missing: string[] = [];
  if (value.length < PASSWORD_MIN_LENGTH) {
    missing.push(`at least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (!/[a-z]/.test(value)) missing.push("a lowercase letter");
  if (!/[A-Z]/.test(value)) missing.push("an uppercase letter");
  if (!/\d/.test(value)) missing.push("a number");
  if (!includesAllowedSymbol(value)) missing.push("a supported symbol");

  if (missing.length > 0) {
    throw new SafeHttpError(
      400,
      "weak_password",
      `Use ${missing.join(", ")}.`,
    );
  }

  return value;
}
