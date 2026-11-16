import type { Point } from "../learning-common/model";
import { targets, predict, grid, type Network, type Target } from "./model";

const fmt = (x: number) => Math.abs(x) < 1e-8 ? "0" : x.toFixed(2);
/** データから軸を決定し、範囲外の発散を切り捨てて隠さない。 */
export function curveChart(net: Network, id: Target, train: readonly Point[] = [], evaluation: readonly Point[] = []) {
  const target = targets[id], points = grid(id);
  const ys = points.flatMap(p => [p.y, predict(net, p.x)]);
  const lo = Math.min(0, ...ys), hi = Math.max(1, ...ys), pad = (hi - lo) * .12;
  const ymin = lo - pad, ymax = hi + pad;
  const sx = (x: number) => 60 + 460 * (x - target.min) / (target.max - target.min);
  const sy = (y: number) => 300 - 260 * (y - ymin) / (ymax - ymin);
  const line = (f: (x: number) => number) => points.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(2)},${sy(f(p.x)).toFixed(2)}`).join(" ");
  const xLabel = (x: number) => id === "sin" && x !== 0 ? (x < 0 ? "−π" : "π") : fmt(x);
  const ticks = [target.min, 0, target.max].map(x => `<text x="${sx(x)}" y="325" text-anchor="middle">${xLabel(x)}</text>`).join("") +
    [ymin, 0, ymax].map(y => `<text x="51" y="${sy(y) + 5}" text-anchor="end">${fmt(y)}</text>`).join("");
  return `<svg class="ua-plot" viewBox="0 0 560 355" role="img" aria-label="目標関数${target.label}とReLUモデル。横軸x、縦軸y。範囲${target.min.toFixed(2)}〜${target.max.toFixed(2)}"><path d="M60 30V300H530" fill="none" stroke="currentColor"/><path d="M60 ${sy(0)}H520" stroke="var(--border)"/>${ticks}<text x="535" y="325">x</text><text x="25" y="22">y</text><path d="${line(target.f)}" fill="none" stroke="#414148" stroke-width="3" stroke-dasharray="7 4"/><path d="${line(x => predict(net, x))}" fill="none" stroke="var(--brand)" stroke-width="2.5"/>${evaluation.map(p => `<path d="M${sx(p.x)},${sy(p.y) - 3}l-3,6h6z" fill="white" stroke="#93631a"/>`).join("")}${train.map(p => `<circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="4" fill="white" stroke="var(--brand)" stroke-width="1.5"/>`).join("")}</svg>`;
}
export interface LossRecord { readonly step: number; readonly loss: number }
export function lossChart(history: readonly LossRecord[], limit: number) {
  const top = Math.max(1e-6, ...history.map(p => p.loss));
  // 最大201描画点に間引く。数値履歴自体は各更新後の損失を保持する。
  const stride = Math.max(1, Math.ceil(history.length / 200));
  const shown = history.filter((_, i) => i % stride === 0 || i === history.length - 1);
  return `<svg class="ua-plot" viewBox="0 0 560 220" role="img" aria-label="更新回数に対する訓練MSEの履歴"><path d="M65 30V165H520" fill="none" stroke="currentColor"/><text x="5" y="28">${top.toPrecision(3)}</text><text x="38" y="170">0</text><text x="65" y="190">0</text><text x="475" y="190">${limit}</text><text x="230" y="215">学習更新回数</text><polyline points="${shown.map(p => `${65 + 450 * p.step / limit},${165 - 130 * p.loss / top}`).join(" ")}" fill="none" stroke="var(--brand)" stroke-width="2.5"/></svg>`;
}
