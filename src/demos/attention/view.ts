import { mountLlm, probabilityBars } from "../llm-common/view";
import { attentionLabels, attentionValues, calculateAttention, initialKeys, initialQuery, type Vector2 } from "./model";

const stages = ["Queryを作る", "Keyとの対応度を計算する", "Softmaxで重みに変換する", "Valueを重み付きで合成する", "更新に使う表現を表示する"] as const;
const vectorText = (value: Vector2) => `(${value[0].toFixed(4)}, ${value[1].toFixed(4)})`;

export function mountAttention(root: HTMLElement): () => void {
  let query: Vector2 = initialQuery;
  let keys: readonly Vector2[] = initialKeys;
  let stage = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  const abort = new AbortController();
  const clearTimer = () => { if (timer !== undefined) clearInterval(timer); timer = undefined; };
  const stop = () => { clearTimer(); layout.controls.setRunning(false); };
  const advance = () => {
    stage = Math.min(stage + 1, stages.length - 1);
    if (stage === stages.length - 1) stop();
    render();
  };
  const layout = mountLlm(root, "attention", "QueryとKeyの成分を変え、1ステップずつ計算を確認します。数値変更で段階1に戻ります。自動実行は段階5で停止します。", {
    step: advance,
    start: () => { clearTimer(); timer = setInterval(advance, 1000); },
    stop: clearTimer,
    reset: () => {
      stop(); query = initialQuery; keys = initialKeys; stage = 0;
      for (const input of inputs) input.value = String(readComponent(input));
      render();
    },
  });
  const componentInputs = (label: string, target: string, vector: Vector2) => `<fieldset><legend>${label}</legend>${vector.map((value, axis) => `<label>第${axis + 1}成分 <input type="number" min="-10" max="10" step="0.1" value="${value}" data-vector="${target}" data-axis="${axis}" aria-label="${label}の第${axis + 1}成分"></label>`).join("")}</fieldset>`;
  layout.body.innerHTML = `<p class="llm-output">太郎は花子に本を渡した。彼女はそれを読んだ。</p>
    <p>「彼女」の位置から3つの語を参照する、2次元の教材用計算です。文章からベクトルを推定する実際のLLMは使いません。</p>
    <div class="llm-grid"><section class="llm-panel"><h2>Query・Keyの設定</h2><p>成分は−10〜10。Valueは固定です。</p>${componentInputs("Query q（彼女）", "q", query)}${keys.map((key, i) => componentInputs(`Key k（${attentionLabels[i]}）`, String(i), key)).join("")}</section>
    <section class="llm-panel"><h2>5段階の計算</h2><ol data-stages>${stages.map(label => `<li>${label}</li>`).join("")}</ol><div data-calculation></div></section></div>
    <section class="llm-panel"><h2>読み取りの注意</h2><p>スライド25〜27の 0.2・0.7・0.1 は説明用の架空の重みです。ここでは指定したベクトルから内積・Softmaxを実計算するため、別の値になります。</p><p>実際のモデルでは学習された行列 W<sub>Q</sub>・W<sub>K</sub>・W<sub>V</sub>で表現を変換します。この画面は変換後のQuery・Key・Valueを直接指定しています。学習パラメータは学習で更新されますが、Attentionの重みは入力からその都度計算されます。</p><p>Attentionの重みは人間の意味理解そのものでも、代名詞の指示対象を直接推定した結果でもありません。ここでは単一ヘッドの重み付き和を示し、Transformer全体の処理や残差接続は再現していません。</p></section>`;
  const calculation = layout.body.querySelector<HTMLElement>("[data-calculation]")!;
  const inputs = [...layout.body.querySelectorAll<HTMLInputElement>("input[data-vector]")];
  const readComponent = (input: HTMLInputElement) => {
    const vector = input.dataset.vector === "q" ? query : keys[Number(input.dataset.vector)]!;
    return vector[Number(input.dataset.axis) as 0 | 1];
  };
  for (const input of inputs) {
    input.addEventListener("change", () => {
      const value = input.valueAsNumber;
      if (!Number.isFinite(value) || value < -10 || value > 10) {
        input.value = String(readComponent(input));
        layout.status.textContent = "成分は−10〜10の数値を入力してください。直前の値を保持しました。";
        return;
      }
      stop();
      const axis = Number(input.dataset.axis) as 0 | 1;
      const replacement = (vector: Vector2): Vector2 => axis === 0 ? [value, vector[1]] : [vector[0], value];
      if (input.dataset.vector === "q") query = replacement(query);
      else keys = keys.map((key, i) => i === Number(input.dataset.vector) ? replacement(key) : key);
      stage = 0; render();
    }, { signal: abort.signal });
  }
  function render() {
    const result = calculateAttention(query, keys, attentionValues);
    const tableRows = attentionLabels.map((label, i) => `<tr><th scope="row">${label}</th><td>${vectorText(keys[i]!)}</td><td>${result.dots[i]!.toFixed(4)}</td><td>${result.scores[i]!.toFixed(4)}</td></tr>`).join("");
    calculation.innerHTML = `<h3>${stage + 1} / 5：${stages[stage]}</h3><p>q = ${vectorText(query)}、d<sub>k</sub> = 2</p>
      ${stage >= 1 ? `<p>対応度 = q・k / √2</p><div class="llm-scroll" tabindex="0" role="region" aria-label="内積と対応度の表"><table><thead><tr><th scope="col">参照先</th><th scope="col">Key</th><th scope="col">内積 q・k</th><th scope="col">内積 / √2</th></tr></thead><tbody>${tableRows}</tbody></table></div>` : "<p>この例ではQueryを直接設定します。1ステップでKeyとの内積を計算します。</p>"}
      ${stage >= 2 ? `<h3>Attentionの重み</h3><p>αᵢ = exp(sᵢ) / Σ exp(sⱼ)</p>${probabilityBars(attentionLabels, result.weights, "Attentionの重み")}<p>重みの合計 = ${result.weights.reduce((a, b) => a + b, 0).toFixed(4)}（表示は丸めています）</p>` : ""}
      ${stage >= 3 ? `<h3>各Valueの寄与</h3><div class="llm-scroll" tabindex="0" role="region" aria-label="Valueと重み付き寄与の表"><table><thead><tr><th scope="col">参照先</th><th scope="col">Value</th><th scope="col">重み × Value</th></tr></thead><tbody>${attentionLabels.map((label, i) => `<tr><th scope="row">${label}</th><td>${vectorText(attentionValues[i]!)}</td><td>${vectorText(result.contributions[i]!)}</td></tr>`).join("")}</tbody></table></div>` : ""}
      ${stage >= 4 ? `<h3>Attention出力</h3><p class="llm-output">Σ αᵢ vᵢ = ${vectorText(result.output)}</p><p>参照先の情報を合成した、「彼女」の表現の更新に使うベクトルです。これはAttention部分の出力です。</p>` : ""}`;
    layout.body.querySelectorAll<HTMLElement>("[data-stages] li").forEach((item, i) => {
      item.classList.toggle("selected", i === stage);
      if (i === stage) item.setAttribute("aria-current", "step"); else item.removeAttribute("aria-current");
    });
    layout.controls.setCompleted(stage === stages.length - 1);
    layout.status.textContent = `段階${stage + 1}：${stages[stage]}。${stage === 4 ? `Attention出力は${vectorText(result.output)}です。` : "次のステップで計算を進められます。"}`;
  }
  render();
  return () => { clearTimer(); abort.abort(); layout.dispose(); };
}
