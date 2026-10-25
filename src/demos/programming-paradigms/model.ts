export interface SumFrame {
  addend: number;
  before: number;
  total: number;
}
export function sumSteps(n: number): SumFrame[] {
  if (!Number.isInteger(n) || n < 1 || n > 20)
    throw new RangeError("Nは1〜20の整数です");
  const frames: SumFrame[] = [{ addend: 0, before: 0, total: 0 }];
  let total = 0;
  for (let addend = 1; addend <= n; addend++) {
    const before = total;
    total += addend;
    frames.push({ addend, before, total });
  }
  return frames;
}
