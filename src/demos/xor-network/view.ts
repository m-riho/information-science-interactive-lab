import { renderNetwork } from "./networkView";
import { lesson, spark } from "../learning-common/lesson";
import { training, output, xorData } from "./model";
import { svg, axes, sx, sy } from "../learning-common/view";
export function mountXor(root: HTMLElement) {
  const abort = new AbortController();
  let currentWeights: readonly number[] = [],
    currentEpoch = 0,
    currentMulti = true;
  const l = lesson(
    root,
    6,
    `<div class="transport"><label class="lesson-field">モデル<select data-mode><option value="single">単層：直線の境界</option><option value="multi" selected>多層：2→4→1</option></select></label><label class="lesson-field">学習率<select data-rate><option>0.1</option><option selected>0.5</option><option>1</option></select></label></div><section class="lesson-panel"><h2>ネットワークと各ノードのパラメータ</h2><label class="lesson-field">図で追う入力<select data-network-input>${xorData.map((d, i) => `<option value="${i}">(${d.x}, ${d.y})</option>`).join("")}</select></label><div data-network></div></section><div class="lesson-grid"><section class="lesson-panel"><h2>判定領域</h2><div data-boundary></div><p>薄い領域：予測0、濃い領域：予測1。点のラベルはXORの正解です。領域の境は出力0.5に対応します。</p></section><section class="lesson-panel"><h2>学習結果</h2><div data-results></div><div data-loss></div></section></div><p>初期重みはシード7で固定。単層はSigmoid、多層は隠れ層tanh・出力Sigmoid。交差エントロピー損失を全4点で平均し、勾配降下で更新します。多層は誤差逆伝播を使います。1ステップ＝50更新、最大5000更新で終了。設定変更で重みを初期化します。</p><p>学習例の成功は、どんな初期値でも成功するという保証ではありません。単層でXORを直線分離できないことは第6回で扱った表現上の限界です。</p>`,
    () => {
      mode.value = "multi";
      networkInput.value = "0";
      rate.value = "0.5";
      restart();
    },
    "単層・多層を切り替え、同じ4点を学習させてください。損失と判定領域の変化を比較できます。",
  );
  const mode = l.body.querySelector<HTMLSelectElement>("[data-mode]")!,
    rate = l.body.querySelector<HTMLSelectElement>("[data-rate]")!;
  const networkInput = l.body.querySelector<HTMLSelectElement>(
    "[data-network-input]",
  )!;
  function drawNetwork() {
    const d = xorData[Number(networkInput.value)]!;
    l.body.querySelector("[data-network]")!.innerHTML = renderNetwork(
      currentWeights,
      d.x,
      d.y,
      currentMulti,
      currentEpoch,
    );
  }
  function restart() {
    const multi = mode.value === "multi",
      fs = training(multi, Number(rate.value));
    l.setFrames(fs.length, (i) => {
      const f = fs[i]!;
      currentWeights = f.w;
      currentEpoch = f.epoch;
      currentMulti = multi;
      drawNetwork();
      let cells = "";
      for (let y = 0; y < 24; y++)
        for (let x = 0; x < 24; x++) {
          const p = output(f.w, x / 23, y / 23, multi).p;
          cells += `<rect x="${40 + x * 15}" y="${45 + (23 - y) * 10}" width="15" height="10" fill="${p >= 0.5 ? "#b095ce" : "#f2ecf7"}"/>`;
        }
      l.body.querySelector("[data-boundary]")!.innerHTML = svg(
        cells +
          axes +
          xorData
            .map(
              (d) =>
                `<circle cx="${sx(d.x)}" cy="${sy(d.y)}" r="12" fill="white" stroke="var(--brand)" stroke-width="2"/><text x="${sx(d.x) - 4}" y="${sy(d.y) + 5}">${d.label}</text>`,
            )
            .join(""),
        "XORの正解4点と学習後の領域",
      );
      const correct = xorData.filter(
        (d) => Number(output(f.w, d.x, d.y, multi).p >= 0.5) === d.label,
      ).length;
      l.body.querySelector("[data-results]")!.innerHTML =
        `<p>更新${f.epoch}回 ／ 損失${f.loss.toFixed(5)} ／ 正解${correct} / 4</p><table class="per-table"><caption>4点の出力</caption><thead><tr><th>入力</th><th>出力</th><th>予測</th></tr></thead><tbody>${xorData
          .map((d) => {
            const p = output(f.w, d.x, d.y, multi).p;
            return `<tr><th>(${d.x},${d.y})</th><td>${p.toFixed(3)}</td><td>${Number(p >= 0.5)}</td></tr>`;
          })
          .join("")}</tbody></table>`;
      l.body.querySelector("[data-loss]")!.innerHTML = spark(
        fs.slice(0, i + 1).map((f) => f.loss),
        "平均損失",
      );
      l.status.textContent = `${multi ? "多層" : "単層"}：${f.epoch}回更新。正解${correct} / 4。${i === fs.length - 1 ? "5000更新で終了。" : ""}`;
    });
  }
  networkInput.addEventListener("change", drawNetwork, {
    signal: abort.signal,
  });
  mode.addEventListener("change", restart, { signal: abort.signal });
  rate.addEventListener("change", restart, { signal: abort.signal });
  l.setIntervalMs(100);
  restart();
  return () => {
    abort.abort();
    l.dispose();
  };
}
