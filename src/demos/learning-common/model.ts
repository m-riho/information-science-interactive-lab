export interface Point {
  readonly x: number;
  readonly y: number;
}
export function random(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
export const andPoints = [
  { x: 0, y: 0, label: 0 },
  { x: 0, y: 1, label: 0 },
  { x: 1, y: 0, label: 0 },
  { x: 1, y: 1, label: 1 },
] as const;
export type Weights = readonly [number, number, number];
export function classify(p: Point, w: Weights) {
  const score = w[0] * p.x + w[1] * p.y + w[2];
  return { score, prediction: score > 0 ? 1 : 0 };
}
export function update(w: Weights, index: number, rate: number): Weights {
  const p = andPoints[index];
  if (!p || !Number.isFinite(rate) || rate <= 0)
    throw new RangeError("入力と学習率を確認してください");
  const error = p.label - classify(p, w).prediction;
  return [
    w[0] + rate * error * p.x,
    w[1] + rate * error * p.y,
    w[2] + rate * error,
  ];
}
export const mistakes = (w: Weights) =>
  andPoints.filter((p) => classify(p, w).prediction !== p.label).length;
export function learningFrames(
  rate: number,
  order: readonly number[],
  initial: Weights = [1, 1, -0.5],
) {
  if (
    order.length !== 4 ||
    new Set(order).size !== 4 ||
    order.some((i) => !Number.isInteger(i) || i < 0 || i > 3)
  )
    throw new RangeError("4点の順序が必要です");
  let w = initial,
    updates = 0;
  const frames = [{ weights: w, index: -1, updates, attempt: 0, before: w }];
  for (let i = 0; i < 400 && mistakes(w) > 0; i++) {
    const index = order[i % 4]!,
      next = update(w, index, rate);
    if (next.some((v, j) => v !== w[j])) updates++;
    frames.push({ weights: next, index, updates, attempt: i + 1, before: w });
    w = next;
  }
  return frames;
}
