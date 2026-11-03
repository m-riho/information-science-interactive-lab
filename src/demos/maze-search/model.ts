export const grid = [
  ["A", "B", "C", null],
  ["D", null, "E", "F"],
  [null, null, null, "G"],
] as const;
export type Place = Exclude<(typeof grid)[number][number], null>;
export const places = grid.flat().filter((p): p is Place => p !== null);
export function position(p: Place) {
  const y = grid.findIndex((row) => row.some((cell) => cell === p));
  return { x: grid[y]!.findIndex((cell) => cell === p), y };
}
export function neighbors(p: Place) {
  const a = position(p);
  return places
    .filter((q) => {
      const b = position(q);
      return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
    })
    .sort();
}
export type Method = "BFS" | "DFS";
export interface SearchFrame {
  current: Place | null;
  queue: Place[];
  visited: Place[];
  path: Place[];
  parents: ReadonlyMap<Place, Place>;
}
export function search(method: Method, start: Place = "A") {
  const queue: Place[] = [start],
    seen = new Set(queue),
    visited: Place[] = [],
    parent = new Map<Place, Place>();
  // Each frame keeps the tree as it was when these candidates were discovered.
  const frames: SearchFrame[] = [
    {
      current: null,
      queue: [...queue],
      visited: [],
      path: [],
      parents: new Map(parent),
    },
  ];
  while (queue.length) {
    const p = queue.shift()!;
    visited.push(p);
    const path: Place[] = [];
    if (p === "G") {
      let q: Place | undefined = p;
      while (q) {
        path.unshift(q);
        q = parent.get(q);
      }
    } else {
      const next = neighbors(p).filter((q) => !seen.has(q));
      for (const q of next) {
        seen.add(q);
        parent.set(q, p);
      }
      if (method === "BFS") queue.push(...next);
      else queue.unshift(...next);
    }
    frames.push({
      current: p,
      queue: [...queue],
      visited: [...visited],
      path,
      parents: new Map(parent),
    });
    if (p === "G") break;
  }
  return frames;
}
