const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,80}$/;

export function getRequestId(request: Request): string {
  const supplied = request.headers.get("x-request-id")?.trim() || "";
  return REQUEST_ID_PATTERN.test(supplied) ? supplied : crypto.randomUUID();
}
