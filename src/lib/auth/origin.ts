export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const expected = process.env.APP_ORIGIN || new URL(request.url).origin;
  return origin === expected;
}
