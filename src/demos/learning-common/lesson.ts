import { mountDemoLayout } from "../../components/demoLayout";
import { mountStepLesson } from "../../components/stepLesson";
import { session07Materials, session07Config } from "../../sessions/session07";
export function lesson(
  root: HTMLElement,
  index: number,
  html: string,
  reset: () => void,
  instructions: string,
  stepped = true,
) {
  const material = session07Materials[index]!;
  const l = stepped
    ? mountStepLesson(root, material, reset, session07Config)
    : {
        ...mountDemoLayout(root, material, { reset }, session07Config),
        setFrames: (_n: number, _r: (i: number) => void) => {},
        setIntervalMs: (_ms: number) => {},
      };
  l.instructions.textContent = instructions;
  l.body.innerHTML = `<p>対応スライド：${material.slides}</p>${html}<p>考えてみよう：${material.question}</p>`;
  return l;
}
export const percent = (v: number | null) =>
  v === null ? "定義できません（分母0）" : (v * 100).toFixed(1) + "％";
export const spark = (values: readonly number[], title: string) => {
  if (!values.length) return "<p>まだ記録はありません。</p>";
  const lo = Math.min(0, ...values),
    hi = Math.max(1, ...values),
    point = (v: number, i: number) =>
      `${30 + (i * 360) / Math.max(1, values.length - 1)},${150 - ((v - lo) * 120) / (hi - lo)}`;
  return `<svg class="ml-plot" viewBox="0 0 420 185" role="img" aria-label="${title}"><path d="M30 20V150H400" stroke="currentColor" fill="none"/><polyline points="${values.map(point).join(" ")}" fill="none" stroke="var(--brand)" stroke-width="2"/><text x="0" y="20">${hi.toFixed(2)}</text><text x="0" y="150">${lo.toFixed(2)}</text><text x="200" y="178">${title}（左から順）</text></svg>`;
};
