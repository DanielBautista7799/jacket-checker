export function logSecurityEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, unknown> = {},
) {
  const safeDetails = Object.fromEntries(
    Object.entries(details).filter(([key]) => !/token|authorization|secret|image|base64|email/i.test(key)),
  );
  console[level](event, safeDetails);
}
