import { chips } from "./data";
export type AxisScale = "linear" | "log";
export const START_YEAR = 1971;
export const END_YEAR = 2050;
export const periods = [12, 18, 24] as const;
/** 同じ起点を使った教育用指数モデル。データへの回帰・将来予測ではない。 */
export function modelCount(year: number, months: number): number {
  return 2300 * 2 ** (((year - START_YEAR) * 12) / months);
}
export function axisMaximum(months: readonly number[]): number {
  const largest = Math.max(
    ...chips.map((chip) => chip.count),
    ...months.map((m) => modelCount(END_YEAR, m)),
  );
  const unit = 10 ** Math.floor(Math.log10(largest));
  return Math.ceil(largest / unit) * unit;
}
/** 縦軸の下端=0、上端=1。対数軸の下端は1000個。 */
export function axisPosition(
  value: number,
  scale: AxisScale,
  maximum: number,
): number {
  return scale === "linear"
    ? value / maximum
    : (Math.log10(value) - 3) / (Math.log10(maximum) - 3);
}
export function formatCount(value: number): string {
  if (value >= 1e15) return `${value.toExponential(2)} 個`;
  if (value >= 1e12)
    return `${Number((value / 1e12).toPrecision(4)).toLocaleString("ja-JP")} 兆個`;
  if (value >= 1e8)
    return `${Number((value / 1e8).toPrecision(4)).toLocaleString("ja-JP")} 億個`;
  if (value >= 1e4)
    return `${Number((value / 1e4).toPrecision(4)).toLocaleString("ja-JP")} 万個`;
  return `${Math.round(value).toLocaleString("ja-JP")} 個`;
}
