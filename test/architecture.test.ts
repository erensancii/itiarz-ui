import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Layering rules from src/README.md, checked on the source text:
 * app → features → shared → server; features don't import each other; client code never imports
 * server code; *.server.ts starts with import "server-only"; no "../" imports.
 */
const ROOT = join(__dirname, "..", "src");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

const sources = files(ROOT).map((path) => {
  const text = readFileSync(path, "utf8");
  const rel = relative(ROOT, path).split(sep).join("/");
  const imports = [...text.matchAll(/(?:^|\n)\s*(?:import|export)[^"';]*?from\s*["']([^"']+)["']|(?:^|\n)\s*import\s*["']([^"']+)["']/g)].map(
    (m) => m[1] ?? m[2]!,
  );
  return { rel, text, imports };
});

const featureOf = (rel: string) => /^features\/([^/]+)\//.exec(rel)?.[1];
const isClient = (s: { rel: string; text: string }) => /\.client\.ts$/.test(s.rel) || /^\s*["']use client["']/.test(s.text);
const violations = (pred: (s: (typeof sources)[number], imp: string) => boolean) =>
  sources.flatMap((s) => s.imports.filter((imp) => pred(s, imp)).map((imp) => `${s.rel} → ${imp}`));

describe("architecture", () => {
  it("found the source tree", () => {
    expect(sources.length).toBeGreaterThan(40);
  });

  it("features do not import other features", () => {
    expect(
      violations((s, imp) => {
        const own = featureOf(s.rel);
        const target = /^@\/features\/([^/]+)/.exec(imp)?.[1];
        return !!own && !!target && target !== own;
      }),
    ).toEqual([]);
  });

  it("shared and server never import features; server never imports shared", () => {
    expect(
      violations(
        (s, imp) =>
          ((s.rel.startsWith("shared/") || s.rel.startsWith("server/")) && imp.startsWith("@/features/")) ||
          (s.rel.startsWith("server/") && imp.startsWith("@/shared/")),
      ),
    ).toEqual([]);
  });

  it("client code never imports server code", () => {
    expect(violations((s, imp) => isClient(s) && (imp.startsWith("@/server/") || /\.server$/.test(imp)))).toEqual([]);
  });

  it("every *.server.ts starts with import \"server-only\"", () => {
    const missing = sources
      .filter((s) => /\.server\.ts$/.test(s.rel))
      .filter((s) => !/^(\s*\/\/[^\n]*\n|\s*\/\*[\s\S]*?\*\/\s*)*\s*import\s+["']server-only["'];/.test(s.text))
      .map((s) => s.rel);
    expect(missing).toEqual([]);
  });

  // A server component cannot hand a function (e.g. Next's Link as `component`) to an MUI client
  // component; Next fails at request time with "Functions cannot be passed directly to Client Components".
  it("server components never pass a function as an MUI `component` prop", () => {
    const offenders = sources
      .filter((s) => /\.tsx$/.test(s.rel) && !isClient(s))
      .filter((s) => /component=\{(?!["'])[A-Za-z_]/.test(s.text))
      .map((s) => s.rel);
    expect(offenders).toEqual([]);
  });

  it("imports never climb directories with ../", () => {
    expect(violations((_, imp) => imp.startsWith("../"))).toEqual([]);
  });
});
