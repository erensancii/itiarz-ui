// Deterministic dev-only configuration for unit tests (never used at runtime).
process.env.KC_PUBLIC_URL = "http://localhost:8081";
process.env.KC_INTERNAL_URL = "http://keycloak:8080";
process.env.KC_REALM = "itiarz";
process.env.KC_WEB_CLIENT_SECRET = "test_client_secret";
process.env.API_INTERNAL_URL = "http://api:8080";
process.env.REDIS_URL = "redis://redis:6379";
process.env.SESSION_SECRET = "test_session_secret_at_least_32_characters";
process.env.APP_URL = "http://localhost:3000";
process.env.COOKIE_SECURE = "false";
import "@testing-library/jest-dom/vitest";

// React Testing Library unmounts after each test only when Vitest globals are on; do it explicitly.
import { afterEach } from "vitest";
afterEach(async () => {
  if (typeof document !== "undefined") (await import("@testing-library/react")).cleanup();
});
