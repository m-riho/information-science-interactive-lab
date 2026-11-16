import { random, type Point } from "../learning-common/model";
export const truth = (x: number) => 0.5 + 0.3 * Math.sin(2 * Math.PI * x);
export function data(n: number, noise: number, seed: number): Point[] {
  const r = random(seed);
  return Array.from({ length: n }, (_, i) => {
    const x = (i + 0.15 + 0.7 * r()) / n;
    return { x, y: truth(x) + (r() - 0.5) * noise };
  });
}
function features(x: number, d: number) {
  const z = 2 * x - 1,
    a = [1];
  if (d) a.push(z);
  for (let k = 2; k <= d; k++) a.push(2 * z * a[k - 1]! - a[k - 2]!);
  return a;
}
/** Chebyshev基底、正則化項を追加したHouseholder QR。正規方程式は作らない。 */
export function fit(points: readonly Point[], degree: number, lambda = 1e-6) {
  if (
    !Number.isInteger(degree) ||
    degree < 1 ||
    degree > 15 ||
    points.length < 2 ||
    lambda <= 0 ||
    !Number.isFinite(lambda)
  )
    throw new RangeError("次数・データ数・正則化を確認してください");
  const n = degree + 1,
    A = points.map((p) => features(p.x, degree)),
    b = points.map((p) => p.y);
  for (let j = 0; j < n; j++) {
    A.push(
      Array.from({ length: n }, (_, i) => (i === j ? Math.sqrt(lambda) : 0)),
    );
    b.push(0);
  }
  for (let k = 0; k < n; k++) {
    const v = A.slice(k).map((row) => row[k]!);
    const norm = Math.hypot(...v);
    v[0] = v[0]! + (v[0]! >= 0 ? norm : -norm);
    const scale = Math.hypot(...v);
    if (scale === 0) continue;
    for (let i = 0; i < v.length; i++) v[i] = v[i]! / scale;
    for (let j = k; j < n; j++) {
      const dot = v.reduce((s, t, i) => s + t * A[k + i]![j]!, 0);
      for (let i = 0; i < v.length; i++)
        A[k + i]![j] = A[k + i]![j]! - 2 * v[i]! * dot;
    }
    const dot = v.reduce((s, t, i) => s + t * b[k + i]!, 0);
    for (let i = 0; i < v.length; i++) b[k + i] = b[k + i]! - 2 * v[i]! * dot;
  }
  const coef = Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--)
    coef[i] =
      (b[i]! -
        coef.slice(i + 1).reduce((s, c, j) => s + c * A[i]![i + 1 + j]!, 0)) /
      A[i]![i]!;
  return coef;
}
export const predict = (x: number, coef: readonly number[]) =>
  features(x, coef.length - 1).reduce((s, v, i) => s + v * coef[i]!, 0);
export const mse = (points: readonly Point[], coef: readonly number[]) =>
  points.reduce((s, p) => s + (predict(p.x, coef) - p.y) ** 2, 0) /
  points.length;
