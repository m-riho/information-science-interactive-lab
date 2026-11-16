import { mountDemoLayout } from "../../components/demoLayout";
import { session07Config, session07Materials } from "../../sessions/session07";
import { data, fit, predict, mse, truth } from "./model";
import {
  svg,
  axes,
  dot,
  sx,
  sy,
  field,
  numbers,
} from "../learning-common/view";
export function mountOverfit(root: HTMLElement) {
  let seed = 7;
  const abort = new AbortController();
  const l = mountDemoLayout(
    root,
    session07Materials[7],
    {
      reset: () => {
        degree.value = "3";
        count.value = "12";
        noise.value = ".25";
        seed = 7;
        render();
      },
    },
    session07Config,
  );
  l.instructions.textContent =
    "次数・訓練データ数・ノイズを変え、訓練誤差と検証誤差を比較してください。「訓練データを再生成」では別の訓練標本を試します。";
  l.body.innerHTML = `<p>対応スライド：37–41</p><div class="lesson-grid"><section class="lesson-panel">${field("多項式次数", "poly-d", 1, 15, 1, 3)}${field("訓練データ数", "poly-n", 6, 60, 1, 12)}${field("ノイズ幅", "poly-noise", 0, 0.6, 0.05, 0.25)}<button data-generate>訓練データを再生成</button><p data-metrics></p></section><section class="lesson-panel"><div data-chart></div><p>●：訓練点　△：検証点　実線：近似曲線　破線：生成元の曲線</p></section></div><p>教育用データ：y = 0.5 + 0.3 sin(2πx) に一様ノイズを加えています。検証用30点は固定シード100で生成し、学習には使いません。ノイズ量変更時には同じ乱数列の振幅だけを変えます。</p><p>計算はChebyshev基底・QR法と弱いL2正則化（λ=10⁻⁶）で安定化しています。曲線が図の範囲外に出ることもあります。検証データはモデル比較用です。最終性能を測るテストデータは別に確保する必要があります。</p><p>考えてみよう：${session07Materials[7].question}</p>`;
  const degree = l.body.querySelector<HTMLInputElement>("#poly-d")!,
    count = l.body.querySelector<HTMLInputElement>("#poly-n")!,
    noise = l.body.querySelector<HTMLInputElement>("#poly-noise")!;
  function render() {
    numbers(l.body);
    const train = data(Number(count.value), Number(noise.value), seed),
      valid = data(30, Number(noise.value), 100),
      coef = fit(train, Number(degree.value));
    const line = (f: (x: number) => number) =>
      Array.from({ length: 121 }, (_, i) => {
        const x = i / 120;
        return `${i ? "L" : "M"}${sx(x)},${sy(f(x))}`;
      }).join(" ");
    l.body.querySelector("[data-chart]")!.innerHTML = svg(
      axes +
        `<defs><clipPath id="poly-clip"><rect x="40" y="20" width="360" height="265"/></clipPath></defs><g clip-path="url(#poly-clip)"><path d="${line(truth)}" fill="none" stroke="#777" stroke-dasharray="5 3"/><path d="${line((x) => predict(x, coef))}" fill="none" stroke="var(--brand)" stroke-width="2"/>${train.map((p) => dot(p, "")).join("")}${valid.map((p) => `<path d="M${sx(p.x)},${sy(p.y) - 4}l-4,8h8z" fill="white" stroke="var(--accent)"/>`).join("")}</g>`,
      "訓練点・検証点と多項式の曲線",
    );
    l.body.querySelector("[data-metrics]")!.textContent =
      `訓練MSE：${mse(train, coef).toFixed(6)} ／ 検証MSE：${mse(valid, coef).toFixed(6)}。シード：${seed}`;
    l.status.textContent = `次数${degree.value}の曲線を${count.value}個の訓練点で当てはめました。検証点は学習に使用していません。`;
  }
  l.body.addEventListener("input", render, { signal: abort.signal });
  l.body.querySelector("[data-generate]")!.addEventListener(
    "click",
    () => {
      seed++;
      render();
    },
    { signal: abort.signal },
  );
  render();
  return () => {
    abort.abort();
    l.dispose();
  };
}
