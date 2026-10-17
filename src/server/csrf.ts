const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF guard for the BFF: state-changing methods must carry an `Origin` header that equals
 * the application origin. Safe methods are always allowed (they must not change state).
 */
export function isSameOrigin(req: Request, appUrl: string): boolean {
  if (SAFE_METHODS.has(req.method.toUpperCase())) return true;
  const origin = req.headers.get("origin");
  if (!origin || origin === "null") return false;
  try {
    return new URL(origin).origin === new URL(appUrl).origin;
  } catch {
    return false;
  }
}
