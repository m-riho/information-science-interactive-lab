import { random, type Point } from "../learning-common/model";

export const targets = {
  sin: { label: "sin(x)", min: -Math.PI, max: Math.PI, f: Math.sin },
  square: { label: "x²", min: -1, max: 1, f: (x: number) => x * x },
  abs: { label: "|x|", min: -1, max: 1, f: Math.abs },
} as const;
export type Target = keyof typeof targets;
export interface Unit { readonly w: number; readonly b: number; readonly a: number }
export interface Network { readonly c: number; readonly units: readonly Unit[] }
export interface Training {
  readonly net: Network;
  readonly m: readonly number[];
  readonly v: readonly number[];
  readonly step: number;
}
export const MAX_STEPS = 5000;
const relu = (z: number) => Math.max(0, z);
function checkN(n: number) {
  if (!Number.isInteger(n) || n < 2 || n > 32) throw new RangeError("Nは2〜32の整数です");
}
export function predict(net: Network, x: number): number {
  return net.units.reduce((sum, u) => sum + u.a * relu(u.w * x + u.b), net.c);
}
/** N区間・N+1節点を、境界1個を含む厳密にN個のReLUで構成。 */
export function construct(id: Target, n: number): Network {
  checkN(n);
  const t = targets[id], h = (t.max - t.min) / n;
  const slopes = Array.from({ length: n }, (_, j) =>
    (t.f(t.min + (j + 1) * h) - t.f(t.min + j * h)) / h);
  return {
    c: t.f(t.min),
    units: slopes.map((m, j) => ({ w: 1, b: -(t.min + j * h), a: j === 0 ? m : m - slopes[j - 1]! })),
  };
}
export function grid(id: Target): Point[] {
  const t = targets[id];
  return Array.from({ length: 401 }, (_, i) => {
    const x = t.min + (t.max - t.min) * i / 400;
    return { x, y: t.f(x) };
  });
}
function checkData(points: readonly Point[]) {
  if (!points.length || points.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y)))
    throw new RangeError("有限な標本データが必要です");
}
export function errors(net: Network, points: readonly Point[]) {
  checkData(points);
  let square = 0, maxAbs = 0;
  for (const p of points) {
    const d = predict(net, p.x) - p.y;
    square += d * d;
    maxAbs = Math.max(maxAbs, Math.abs(d));
  }
  return { mse: square / points.length, maxAbs };
}
export const loss = (net: Network, points: readonly Point[]) => errors(net, points).mse;
export function samples(id: Target) {
  const t = targets[id], point = (s: number) => {
    const x = t.min + (t.max - t.min) * s;
    return { x, y: t.f(x) };
  };
  return {
    train: Array.from({ length: 32 }, (_, j) => point(j / 31)),
    evaluation: Array.from({ length: 124 }, (_, j) => point((j + .5) / 124)),
  };
}
const flatten = (net: Network) => [net.c, ...net.units.flatMap(u => [u.w, u.b, u.a])];
function unflatten(values: readonly number[]): Network {
  return { c: values[0]!, units: Array.from({ length: (values.length - 1) / 3 }, (_, i) => ({
    w: values[1 + 3 * i]!, b: values[2 + 3 * i]!, a: values[3 + 3 * i]!,
  })) };
}
export function initialize(id: Target, n: number, seed: number): Training {
  checkN(n);
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError("シードは0〜4294967295の整数です");
  const rng = random(seed), t = targets[id];
  const net: Network = { c: 0, units: Array.from({ length: n }, () => {
    const w = (rng() < .5 ? -1 : 1) * (.5 + rng());
    const knot = t.min + (t.max - t.min) * rng();
    return { w, b: -w * knot, a: (rng() - .5) * .6 };
  }) };
  return { net, m: Array(3 * n + 1).fill(0) as number[], v: Array(3 * n + 1).fill(0) as number[], step: 0 };
}
/** 全バッチMSEの解析勾配。ReLUの0での微分は0。 */
export function gradients(net: Network, points: readonly Point[]): Network {
  checkData(points);
  const units = net.units.map(() => ({ w: 0, b: 0, a: 0 }));
  let c = 0;
  for (const p of points) {
    const d = 2 * (predict(net, p.x) - p.y) / points.length;
    c += d;
    net.units.forEach((u, i) => {
      const z = u.w * p.x + u.b, g = units[i]!;
      g.a += d * relu(z);
      if (z > 0) { g.w += d * u.a * p.x; g.b += d * u.a; }
    });
  }
  return { c, units };
}
export function trainStep(s: Training, points: readonly Point[], rate: number): Training {
  if (!Number.isFinite(rate) || rate < .001 || rate > .1) throw new RangeError("学習率は0.001〜0.1です");
  if (s.step >= MAX_STEPS) return s;
  const grad = flatten(gradients(s.net, points)), params = flatten(s.net);
  const norm = Math.hypot(...grad), scale = norm > 10 ? 10 / norm : 1;
  const step = s.step + 1, m: number[] = [], v: number[] = [];
  const values = params.map((p, i) => {
    const g = grad[i]! * scale;
    m[i] = .9 * s.m[i]! + .1 * g;
    v[i] = .999 * s.v[i]! + .001 * g * g;
    return p - rate * (m[i]! / (1 - .9 ** step)) / (Math.sqrt(v[i]! / (1 - .999 ** step)) + 1e-8);
  });
  if (![...values, ...m, ...v].every(Number.isFinite)) throw new RangeError("数値が有限範囲を超えました。直前の状態で停止します");
  return { net: unflatten(values), m, v, step };
}
/** 1回のUI更新での仕事量と全体の上限を別に制限する。 */
export function advance(s: Training, points: readonly Point[], rate: number, limit: number, count: number): Training {
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_STEPS || !Number.isInteger(count) || count < 1 || count > 25)
    throw new RangeError("更新上限またはバッチ回数を確認してください");
  let next = s;
  for (let i = 0; i < count && next.step < limit; i++) next = trainStep(next, points, rate);
  return next;
}
