import { distance, type Vector2, type WordPoint } from "../embedding/model";

export function analogyPoints(): WordPoint[] {
  return [
    { id: "king", label: "king", x: 4, y: 8 },
    { id: "man", label: "man", x: 3, y: 3 },
    { id: "woman", label: "woman", x: 7, y: 3 },
    { id: "queen", label: "queen", x: 8.2, y: 7.8 },
    { id: "crown", label: "crown", x: 5.5, y: 6 },
  ];
}

export function analogy(points: readonly WordPoint[]) {
  const get = (id: string) => {
    const point = points.find(p => p.id === id);
    if (!point) throw new RangeError(`単語 ${id} の座標が必要です`);
    return point;
  };
  const king = get("king"), man = get("man"), woman = get("woman");
  const difference = { x: king.x - man.x, y: king.y - man.y };
  const end = { x: difference.x + woman.x, y: difference.y + woman.y };
  const path: Vector2[] = [{ x: 0, y: 0 }, king, difference, end];
  const candidates = points.filter(p => !["king", "man", "woman"].includes(p.id))
    .map(p => ({ label: p.label, distance: distance(end, p) }))
    .sort((a, b) => a.distance - b.distance);
  return { path, candidates };
}
