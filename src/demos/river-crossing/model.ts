export interface State {
  guards: number;
  prisoners: number;
  side: "左" | "右";
}
export interface Load {
  g: number;
  p: number;
}
export const start: State = { guards: 3, prisoners: 3, side: "左" };
export const finished = (s: State) =>
  s.guards === 0 && s.prisoners === 0 && s.side === "右";
export const safe = (g: number, p: number) => g === 0 || p <= g;
export function cross(
  s: State,
  { g, p }: Load,
): { ok: true; state: State } | { ok: false; reason: string } {
  if (!Number.isInteger(g) || !Number.isInteger(p) || g < 0 || p < 0)
    return { ok: false, reason: "人数は0以上の整数で選んでください。" };
  if (!g && !p) return { ok: false, reason: "空の船は動かせません。" };
  if (g + p > 2) return { ok: false, reason: "定員は2人です。" };
  const left = s.side === "左";
  if (
    g > (left ? s.guards : 3 - s.guards) ||
    p > (left ? s.prisoners : 3 - s.prisoners)
  )
    return { ok: false, reason: "出発する岸にその人数はいません。" };
  const guards = s.guards + (left ? -g : g),
    prisoners = s.prisoners + (left ? -p : p);
  if (!safe(guards, prisoners) || !safe(3 - guards, 3 - prisoners))
    return {
      ok: false,
      reason:
        (safe(guards, prisoners) ? "右岸" : "左岸") +
        "で囚人が看守を上回ります。",
    };
  return { ok: true, state: { guards, prisoners, side: left ? "右" : "左" } };
}
export function solution(from: State): Load[] | null {
  const queue = [{ s: from, path: [] as Load[] }],
    seen = new Set([key(from)]);
  for (let i = 0; i < queue.length; i++) {
    const { s, path } = queue[i]!;
    if (finished(s)) return path;
    for (const load of [
      { g: 0, p: 2 },
      { g: 1, p: 1 },
      { g: 2, p: 0 },
      { g: 1, p: 0 },
      { g: 0, p: 1 },
    ]) {
      const r = cross(s, load);
      if (!r.ok || seen.has(key(r.state))) continue;
      seen.add(key(r.state));
      queue.push({ s: r.state, path: [...path, load] });
    }
  }
  return null;
}
function key(s: State) {
  return [s.guards, s.prisoners, s.side].join(":");
}
