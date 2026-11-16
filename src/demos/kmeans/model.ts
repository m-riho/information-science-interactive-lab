import { random, type Point } from "../learning-common/model";
export function dataset(): Point[] {
  const r = random(7);
  return Array.from({ length: 30 }, (_, i) => ({
    x: 0.18 + (i % 3) * 0.3 + (r() - 0.5) * 0.2,
    y: 0.3 + (i % 2) * 0.35 + (r() - 0.5) * 0.2,
  }));
}
export function centers(k: number, seed: number): Point[] {
  if (!Number.isInteger(k) || k < 2 || k > 6) throw new RangeError("kは2〜6");
  const r = random(seed);
  return Array.from({ length: k }, () => ({
    x: 0.1 + r() * 0.8,
    y: 0.1 + r() * 0.8,
  }));
}
export function assign(points: readonly Point[], centers: readonly Point[]) {
  return points.map((p) => {
    let best = 0,
      d = Infinity;
    centers.forEach((c, j) => {
      const v = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
      if (v < d) {
        d = v;
        best = j;
      }
    });
    return best;
  });
}
export function recenter(
  points: readonly Point[],
  labels: readonly number[],
  previous: readonly Point[],
) {
  return previous.map((old, j) => {
    const ps = points.filter((_, i) => labels[i] === j);
    return ps.length
      ? {
          x: ps.reduce((s, p) => s + p.x, 0) / ps.length,
          y: ps.reduce((s, p) => s + p.y, 0) / ps.length,
        }
      : old;
  });
}
export function frames(points: readonly Point[], initial: readonly Point[]) {
  let cs = [...initial],
    labels: number[] = [];
  const fs = [{ centers: cs, labels, phase: "初期状態", done: false }];
  for (let n = 0; n < 60; n++) {
    const next = assign(points, cs);
    const stable =
      labels.length === next.length && next.every((v, i) => v === labels[i]);
    labels = next;
    fs.push({
      centers: cs,
      labels,
      phase: "各点を最も近い中心へ割り当て",
      done: stable,
    });
    if (stable) return fs;
    cs = recenter(points, labels, cs);
    fs.push({
      centers: cs,
      labels,
      phase: "各クラスタの平均へ中心を移動",
      done: false,
    });
  }
  fs[fs.length - 1]!.done = true;
  fs[fs.length - 1]!.phase += "（60反復の上限で停止）";
  return fs;
}
