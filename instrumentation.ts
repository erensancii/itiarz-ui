// Runs once when the Next.js server starts (not during `next build`): fail fast on missing env.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getConfig } = await import("./lib/config");
    getConfig();
  }
}
