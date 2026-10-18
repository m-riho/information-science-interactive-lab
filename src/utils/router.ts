export type Route =
  | { kind: "home" }
  | { kind: "session" }
  | { kind: "demo"; slug: string }
  | { kind: "session04" }
  | { kind: "demo04"; slug: string }
  | { kind: "missing" };
export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, "") || "/";
  if (path === "/") return { kind: "home" };
  if (path === "/sessions/03") return { kind: "session" };
  if (path === "/sessions/04") return { kind: "session04" };
  const fourth = /^\/sessions\/04\/([a-z0-9-]+)$/.exec(path);
  if (fourth?.[1]) return { kind: "demo04", slug: fourth[1] };
  const match = /^\/sessions\/03\/([a-z-]+)$/.exec(path);
  return match?.[1] ? { kind: "demo", slug: match[1] } : { kind: "missing" };
}
