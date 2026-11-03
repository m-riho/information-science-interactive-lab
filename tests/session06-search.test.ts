import { expect, it } from "vitest";
import { neighbors, search } from "../src/demos/maze-search/model";
import {
  start,
  cross,
  solution,
  finished,
  safe,
  type State,
} from "../src/demos/river-crossing/model";
import { treeCounts } from "../src/demos/search-tree/model";
it("資料の枝道と探索順、ゴール経路が一致する", () => {
  expect(neighbors("A")).toEqual(["B", "D"]);
  expect(neighbors("D")).toEqual(["A"]);
  for (const m of ["BFS", "DFS"] as const) {
    const fs = search(m),
      last = fs.at(-1)!;
    expect(last.visited.join("")).toBe(m === "BFS" ? "ABDCEFG" : "ABCEFG");
    expect(last.path.join("")).toBe("ABCEFG");
    expect(fs[1]!.queue).toEqual(["B", "D"]);
    expect(fs[2]!.queue).toEqual(m === "BFS" ? ["D", "C"] : ["C", "D"]);
  }
});
it("川渡りの最少11手と全中間状態、途中からの最短解", () => {
  let s: State = start;
  const path = solution(s)!;
  expect(path).toHaveLength(11);
  for (const [i, load] of path.entries()) {
    expect(solution(s)).toHaveLength(11 - i);
    const r = cross(s, load);
    if (!r.ok) throw Error(r.reason);
    s = r.state;
    expect(
      safe(s.guards, s.prisoners) && safe(3 - s.guards, 3 - s.prisoners),
    ).toBe(true);
  }
  expect(finished(s)).toBe(true);
  expect(solution(s)).toEqual([]);
});
it("空船・過積載・人数不足・危険な岸を拒否する", () => {
  expect(safe(0, 3)).toBe(true);
  expect(safe(1, 2)).toBe(false);
  for (const l of [
    { g: 0, p: 0 },
    { g: 1, p: 2 },
    { g: 1, p: 0 },
  ])
    expect(cross(start, l).ok).toBe(false);
  expect(
    cross({ guards: 3, prisoners: 1, side: "右" }, { g: 1, p: 0 }).ok,
  ).toBe(false);
  expect(cross(start, { g: 0, p: 2 }).ok).toBe(true);
});
it("末端と総数、根だけ・一本鎖・巨大木", () => {
  expect(treeCounts(3, 5)).toEqual({ leaves: 243n, total: 364n });
  expect(treeCounts(3, 10)).toEqual({ leaves: 59049n, total: 88573n });
  expect(treeCounts(10, 0)).toEqual({ leaves: 1n, total: 1n });
  expect(treeCounts(1, 100)).toEqual({ leaves: 1n, total: 101n });
  expect(treeCounts(10, 100).leaves).toBe(10n ** 100n);
  expect(() => treeCounts(3, 101)).toThrow();
});

it("迷路のコマ送りは枝道から通路を戻り、ゴールでは余分に進まない", () => {
  expect(search("BFS", "D").at(-1)?.path.join("")).toBe("DABCEFG");
  expect(search("BFS", "G").at(-1)?.path).toEqual(["G"]);
});

it.each(["BFS", "DFS"] as const)(
  "%sの探索木にはその時点で発見した子だけを含める",
  (method) => {
    const frames = search(method);
    expect([...frames[0]!.parents]).toEqual([]);
    expect([...frames[1]!.parents]).toEqual([
      ["B", "A"],
      ["D", "A"],
    ]);
    expect(frames[2]!.parents.get("C")).toBe("B");
    for (const frame of frames) {
      expect(new Set(["A", ...frame.parents.keys()])).toEqual(
        new Set([...frame.queue, ...frame.visited]),
      );
      for (const [child, parent] of frame.parents) {
        expect(frame.visited).toContain(parent);
        expect(neighbors(parent)).toContain(child);
      }
    }
  },
);
