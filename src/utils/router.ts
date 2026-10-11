export type Route =
  | { kind: "home" }
  | { kind: "session" }
  | { kind: "demo"; slug: string }
  | { kind: "missing" };
export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, "") || "/";
  if (path === "/") return { kind: "home" };
  if (path === "/sessions/03") return { kind: "session" };
  const match = /^\/sessions\/03\/([a-z-]+)$/.exec(path);
  return match?.[1] ? { kind: "demo", slug: match[1] } : { kind: "missing" };
}
