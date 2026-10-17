// Server-only BFF configuration. Read lazily (never at module load) so that `next build`
// does not need runtime secrets; `instrumentation.ts` calls getConfig() at server start
// so a missing variable fails the process immediately instead of on the first request.

export type AppConfig = {
  kcPublicUrl: string;
  kcInternalUrl: string;
  realm: string;
  clientId: string;
  clientSecret: string;
  appUrl: string;
  apiInternalUrl: string;
  redisUrl: string;
  cookieSecure: boolean;
  sessionSecret: string;
};

const REQUIRED = [
  "KC_PUBLIC_URL", "KC_INTERNAL_URL", "KC_REALM", "KC_WEB_CLIENT_SECRET",
  "API_INTERNAL_URL", "REDIS_URL", "SESSION_SECRET",
] as const;

let cached: AppConfig | null = null;

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getConfig(): AppConfig {
  if (cached) return cached;
  const env = process.env;
  const missing = REQUIRED.filter((name) => !env[name] || env[name]!.trim() === "");
  if (missing.length > 0) {
    throw new Error(`itiarz-web: missing required environment variables: ${missing.join(", ")}`);
  }
  if (env.SESSION_SECRET!.length < 32) {
    throw new Error("itiarz-web: SESSION_SECRET must be at least 32 characters");
  }
  const appUrl = trimSlash(env.APP_URL?.trim() || "http://localhost:3000");
  cached = {
    kcPublicUrl: trimSlash(env.KC_PUBLIC_URL!),
    kcInternalUrl: trimSlash(env.KC_INTERNAL_URL!),
    realm: env.KC_REALM!,
    clientId: env.KC_CLIENT_ID?.trim() || "itiarz-web",
    clientSecret: env.KC_WEB_CLIENT_SECRET!,
    // APP_URL is the public origin of the web app (scheme://host[:port]); paths are ignored.
    appUrl: new URL(appUrl).origin,
    apiInternalUrl: trimSlash(env.API_INTERNAL_URL!),
    redisUrl: env.REDIS_URL!,
    cookieSecure: env.COOKIE_SECURE === "true",
    sessionSecret: env.SESSION_SECRET!,
  };
  return cached;
}
