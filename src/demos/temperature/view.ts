import { escapeHtml, mountLlm, probabilityBars } from "../llm-common/view";
import { BASE_PROBABILITIES, CANDIDATE_LABELS, initialSampling, recordSample, sampleIndex, temperatureDistribution } from "./model";

export function mountTemperature(root: HTMLElement): () => void {
  let temperature = 1;
  let state = initialSampling();
  const abort = new AbortController();
  const draw = (count: number) => {
    const probabilities = temperatureDistribution(BASE_PROBABILITIES, temperature);
    for (let i = 0; i < count; i++) state = recordSample(state, sampleIndex(probabilities, Math.random()));
    render();
    const latest = state.history.at(-1);
    layout.status.textContent = `${count}回抽選しました。T=${temperature.toFixed(1)}、合計${state.total}回。${latest ? `最後の結果は「${CANDIDATE_LABELS[latest.candidate]}」です。` : ""}`;
  };
  const layout = mountLlm(root, "temperature", "Temperatureを変えて分布を比較し、「1回抽選」または「100回抽選」で結果を確かめてください。Temperatureの変更時は集計と履歴を0に戻します。", {
    step: () => draw(1),
    reset: () => {
      temperature = 1;
      slider.value = "1";
      state = initialSampling();
      render();
      layout.status.textContent = "Temperatureを1、抽選回数を0に戻しました。";
    },
  });
  root.querySelector<HTMLButtonElement>('[data-action="step"]')!.textContent = "1回抽選";
  layout.body.innerHTML = `<p class="llm-warning">元の確率は説明用の架空数値です。Temperature変換と抽選は実際に計算します。実際のLLMによる予測ではありません。</p>
    <label>Temperature：<output data-temperature>1.0</output><input data-slider type="range" min="0.1" max="3" step="0.1" value="1" aria-label="Temperature"></label>
    <p><code>pᵢ(T) = pᵢ^(1/T) / Σⱼ pⱼ^(1/T)</code>（T &gt; 0）</p>
    <button type="button" data-hundred>100回抽選</button>
    <div class="llm-grid"><section class="llm-panel"><h2>元の確率（T = 1）</h2>${probabilityBars(CANDIDATE_LABELS, BASE_PROBABILITIES)}</section>
    <section class="llm-panel"><h2>Temperature変換後の確率</h2><div data-bars></div><p data-explanation></p></section></div>
    <section class="llm-panel"><h2>抽選結果の集計</h2><p data-total></p><table><caption>現在のTemperatureでの全抽選</caption><thead><tr><th scope="col">候補</th><th scope="col">回数</th><th scope="col">実測割合</th></tr></thead><tbody data-counts></tbody></table><p>抽選の実測割合は、有限回では計算上の確率と一致するとは限りません。</p></section>
    <section class="llm-panel"><h2>抽選履歴（最新24回）</h2><p>集計には全抽選を含め、履歴の表示だけを最新24回に限定します。番号は抽選の通し番号です。</p><ol data-history></ol></section>
    <p class="llm-warning">低いTemperatureは高確率の候補に選択を集中させますが、内容の正確さを保証しません。高いTemperatureでは分布が平らになります。この教材ではT = 0は使用しません。</p>`;
  const get = (selector: string) => layout.body.querySelector<HTMLElement>(selector)!;
  const slider = layout.body.querySelector<HTMLInputElement>("[data-slider]")!;
  function render() {
    get("[data-temperature]").textContent = temperature.toFixed(1);
    get("[data-bars]").innerHTML = probabilityBars(CANDIDATE_LABELS, temperatureDistribution(BASE_PROBABILITIES, temperature));
    get("[data-explanation]").textContent = temperature === 1 ? "T = 1では元の分布と同じです。" : temperature < 1 ? "T < 1：高確率の候補に集中します。" : "T > 1：候補間の確率の差が小さくなります。";
    get("[data-total]").textContent = `T = ${temperature.toFixed(1)} ／ 合計 ${state.total}回`;
    get("[data-counts]").innerHTML = CANDIDATE_LABELS.map((label, i) => `<tr><th scope="row">${escapeHtml(label)}</th><td>${state.counts[i]}</td><td>${state.total ? `${(state.counts[i]! / state.total * 100).toFixed(1)}%` : "未抽選"}</td></tr>`).join("");
    get("[data-history]").innerHTML = state.history.length ? state.history.map(item => `<li value="${item.draw}">${escapeHtml(CANDIDATE_LABELS[item.candidate]!)}</li>`).join("") : "<li>まだ抽選していません。</li>";
  }
  slider.addEventListener("input", () => {
    const value = Number(slider.value);
    temperature = Number.isFinite(value) ? Math.max(0.1, Math.min(3, value)) : 1;
    state = initialSampling();
    render();
    layout.status.textContent = `T = ${temperature.toFixed(1)}に変更し、集計と履歴を初期化しました。`;
  }, { signal: abort.signal });
  get("[data-hundred]").addEventListener("click", () => draw(100), { signal: abort.signal });
  render();
  layout.status.textContent = "T = 1の分布です。抽選結果を比較してみましょう。";
  return () => { abort.abort(); layout.dispose(); };
}
