import type { NextConfig } from "next";

// Note: next.config headers are resolved at BUILD time (routes-manifest), so COOKIE_SECURE
// must be set in the build environment for HSTS to be emitted.
const cookieSecure = process.env.COOKIE_SECURE === "true";

// 'unsafe-inline' for scripts is required by the Next.js App Router inline bootstrap script
// when no nonce is used; a nonce-based CSP is planned for a later iteration (see README).
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "frame-ancestors 'none'",
  "form-action 'self' http://localhost:8081",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  ...(cookieSecure ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
