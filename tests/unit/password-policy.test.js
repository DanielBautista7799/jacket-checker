import { describe, expect, it } from "vitest";
import {
  PASSWORD_ALLOWED_SYMBOLS,
  PASSWORD_MIN_LENGTH,
  getPasswordError,
  getPasswordValidation,
} from "../../src/utils/passwordPolicy";

describe("password policy", () => {
  it("uses a six-character minimum", () => {
    expect(PASSWORD_MIN_LENGTH).toBe(6);
    expect(getPasswordValidation("Aa1!bc").valid).toBe(true);
    expect(getPasswordValidation("Aa1!b").valid).toBe(false);
    expect(getPasswordError("Aa1!b")).toMatch(/6 characters/i);
  });

  it("accepts a longer strong password", () => {
    expect(getPasswordValidation("Correct-Horse7!").valid).toBe(true);
    expect(getPasswordError("Correct-Horse7!")).toBe("");
  });

  it("rejects passwords missing required character types", () => {
    expect(getPasswordValidation("password").valid).toBe(false);
    expect(getPasswordError("password")).toMatch(/uppercase/i);
    expect(getPasswordError("password")).toMatch(/number/i);
    expect(getPasswordError("password")).toMatch(/symbol/i);
  });

  it("uses the same supported symbol family as hosted Supabase Auth", () => {
    expect(PASSWORD_ALLOWED_SYMBOLS).toContain("!");
    expect(PASSWORD_ALLOWED_SYMBOLS).toContain("`");
    expect(getPasswordValidation("Aa1 bc").valid).toBe(false);
    expect(getPasswordValidation("Aa1_bc").valid).toBe(true);
  });
});
