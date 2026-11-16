export type Route =
  | { kind: "home" }
  | { kind: "session" }
  | { kind: "demo"; slug: string }
  | { kind: "session04" }
  | { kind: "demo04"; slug: string }
  | { kind: "session05" }
  | { kind: "demo05"; slug: string }
  | { kind: "session06" }
  | { kind: "demo06"; slug: string }
  | { kind: "session07" }
  | { kind: "material07"; slug: string }
  | { kind: "missing" };
export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, "") || "/";
  if (path === "/") return { kind: "home" };
  if (path === "/sessions/03") return { kind: "session" };
  if (path === "/sessions/04") return { kind: "session04" };
  if (path === "/sessions/05") return { kind: "session05" };
  if (path === "/sessions/06") return { kind: "session06" };
  if (path === "/sessions/07") return { kind: "session07" };
  const seventh = /^\/sessions\/07\/([a-z0-9-]+)$/.exec(path);
  if (seventh?.[1]) return { kind: "material07", slug: seventh[1] };
  const sixth = /^\/sessions\/06\/([a-z0-9-]+)$/.exec(path);
  if (sixth?.[1]) return { kind: "demo06", slug: sixth[1] };
  const fifth = /^\/sessions\/05\/([a-z0-9-]+)$/.exec(path);
  if (fifth?.[1]) return { kind: "demo05", slug: fifth[1] };
  const fourth = /^\/sessions\/04\/([a-z0-9-]+)$/.exec(path);
  if (fourth?.[1]) return { kind: "demo04", slug: fourth[1] };
  const match = /^\/sessions\/03\/([a-z-]+)$/.exec(path);
  return match?.[1] ? { kind: "demo", slug: match[1] } : { kind: "missing" };
}
