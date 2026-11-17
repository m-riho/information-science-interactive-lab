export const quartic = (x: number) => x ** 4 - 4 * x ** 2 + x + 5;
export const derivative = (x: number) => 4 * x ** 3 - 8 * x + 1;

export interface DescentPoint {
  readonly x: number;
  readonly value: number;
  readonly slope: number;
}

function point(x: number): DescentPoint {
  return { x, value: quartic(x), slope: derivative(x) };
}

// f′の符号が変わる3区間それぞれで根を二分法で求め、f″の符号で分類する。
function criticalPoint(lo: number, hi: number) {
  const sign = Math.sign(derivative(lo));
  for (let i = 0; i < 52; i++) {
    const mid = (lo + hi) / 2;
    if (Math.sign(derivative(mid)) === sign) lo = mid;
    else hi = mid;
  }
  const x = (lo + hi) / 2;
  const kind = 12 * x ** 2 - 8 > 0 ? "minimum" : "maximum";
  return { ...point(x), kind } as const;
}

export const extrema = [criticalPoint(-2, -1), criticalPoint(0, 1), criticalPoint(1, 2)] as const;
export const slopeTolerance = 0.00001;
export const maxUpdates = 2000;
export const escapeBound = 100;

export interface DescentTrace {
  readonly points: readonly DescentPoint[];
  readonly reason: "stationary" | "diverged" | "limit";
}

export function descentTrace(initialX: number, rate: number, limit = maxUpdates): DescentTrace {
  if (!Number.isFinite(initialX) || Math.abs(initialX) > escapeBound ||
      !Number.isFinite(rate) || rate <= 0 || !Number.isSafeInteger(limit) || limit < 0) {
    throw new RangeError("初期値・学習率・更新上限を確認してください");
  }
  let current = point(initialX);
  const points = [current];
  for (let step = 0; step <= limit; step++) {
    if (Math.abs(current.slope) <= slopeTolerance) return { points, reason: "stationary" };
    if (step === limit) break;
    const next = point(current.x - rate * current.slope);
    if (![next.x, next.value, next.slope].every(Number.isFinite)) return { points, reason: "diverged" };
    points.push(next);
    if (Math.abs(next.x) > escapeBound) return { points, reason: "diverged" };
    current = next;
  }
  return { points, reason: "limit" };
}
