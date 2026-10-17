"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { readProblem, type Problem } from "./problem";

/**
 * Client-side calls go through the same-origin BFF proxy (/api/proxy/...), never to the backend
 * directly; the browser adds Origin to mutations, which the proxy checks. On success the server
 * components are re-rendered (router.refresh) so the page shows the backend's current state.
 */
export function useApiAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);

  const run = useCallback(
    async <T = unknown>(path: string, method: "POST" | "PATCH" | "DELETE", body?: unknown, opts: { refresh?: boolean } = {}) => {
      setBusy(true);
      setProblem(null);
      try {
        const res = await fetch(`/api/proxy/${path}`, {
          method,
          headers: { "content-type": "application/json", accept: "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
          cache: "no-store",
        });
        if (!res.ok) {
          setProblem(await readProblem(res));
          return null;
        }
        const data = (res.status === 204 ? {} : await res.json().catch(() => ({}))) as T;
        if (opts.refresh !== false) router.refresh();
        return data;
      } catch {
        setProblem({ status: 0 });
        return null;
      } finally {
        setBusy(false);
      }
    },
    [router],
  );

  return { run, busy, problem, clearProblem: () => setProblem(null) };
}
