"use client";

import { useEffect, useRef } from "react";

/**
 * With exactly one membership and no active tenant, the user is switched into it right away
 * (spec §6.2) by submitting that card's POST form once. The card stays visible as a fallback.
 */
export function AutoSubmit({ formId }: { formId: string }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const form = document.getElementById(formId);
    if (form instanceof HTMLFormElement) form.requestSubmit();
  }, [formId]);
  return <p className="muted" aria-live="polite">Şirketinize geçiliyor…</p>;
}
