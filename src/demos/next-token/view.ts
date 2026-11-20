import { escapeHtml, mountLlm, probabilityBars } from "../llm-common/view";
import { advanceGeneration, candidatesFor, initialGeneration, selectCandidate, type GenerationMode } from "./model";

export function mountNextToken(root: HTMLElement): () => void {
  let state = initialGeneration();
  let mode: GenerationMode = "greedy";
  let timer: ReturnType<typeof setInterval> | undefined;
  const abort = new AbortController();
  const stop = () => {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
    layout.controls.setRunning(false);
  };
  const step = () => {
    state = advanceGeneration(state, mode, Math.random());
    render();
  };
  const layout = mountLlm(root, "next-token", "候補を直接選ぶか、選択方式を決めて「1ステップ」を押してください。追加された文章を次の入力として、候補の分布が変わります。自動実行は1秒ごとに進み、EOSで止まります。", {
    step,
    start: () => { timer = setInterval(step, 1000); },
    stop,
    reset: () => {
      stop();
      state = initialGeneration();
      mode = "greedy";
      modeSelect.value = mode;
      render();
    },
  });
  layout.body.innerHTML = `<p class="llm-warning">説明用に設計した架空の確率分布です。実際のLLMは使用していません。ここでは語句を1トークンとして扱う模式例で、実際のトークナイザの分割とは異なります。「その他」は代表例として「置いて」を追加します。</p>
    <label>選択方式 <select data-mode><option value="greedy">最大確率方式</option><option value="sampling">サンプリング方式</option></select></label>
    <div class="llm-grid"><section class="llm-panel"><h2>現在の文章</h2><p class="llm-output" data-text></p><p data-progress></p><p>選択したトークンを末尾に追加し、その文章全体を次の予測の入力にします。EOSは文章を終える特別なトークンです。</p></section>
    <section class="llm-panel"><h2>次の候補と確率</h2><div data-bars></div><div role="group" aria-label="候補を直接選んで追加">${Array.from({ length: 4 }, (_, i) => `<button type="button" data-candidate="${i}"></button>`).join("")}</div><p data-distribution></p></section></div>
    <section class="llm-panel"><h2>生成履歴</h2><ol data-history></ol></section>`;
  const get = (selector: string) => layout.body.querySelector<HTMLElement>(selector)!;
  const modeSelect = layout.body.querySelector<HTMLSelectElement>("[data-mode]")!;
  const candidateButtons = Array.from(layout.body.querySelectorAll<HTMLButtonElement>("[data-candidate]"));
  function render() {
    if (state.done) stop();
    layout.controls.setCompleted(state.done);
    get("[data-text]").textContent = state.text;
    get("[data-progress]").textContent = state.done ? "生成終了：EOSが選ばれました。リセットすると再開できます。" : `${state.history.length}トークンを追加済み（EOSを含む）。`;
    const candidates = candidatesFor(state);
    get("[data-bars]").innerHTML = probabilityBars(candidates.map(c => c.label), candidates.map(c => c.probability));
    candidateButtons.forEach((button, index) => {
      const candidate = candidates[index];
      button.hidden = !candidate;
      button.disabled = !candidate;
      button.textContent = candidate ? `${candidate.label}を選ぶ（${(candidate.probability * 100).toFixed(0)}%）` : "";
    });
    get("[data-distribution]").textContent = state.done ? "終了後の予測は行いません。" : "候補ボタンは手動選択です。1ステップ／自動実行は上の選択方式に従います。";
    get("[data-history]").innerHTML = state.history.length ? state.history.map(item => `<li>入力「${escapeHtml(item.context)}」→ <strong>${escapeHtml(item.label)}</strong>（選択時の確率 ${(item.probability * 100).toFixed(0)}%）</li>`).join("") : "<li>まだ生成していません。</li>";
    const last = state.history.at(-1);
    layout.status.textContent = state.done ? "EOSを選択して生成が終了しました。" : last ? `「${last.label}」を選びました。更新した文章を条件に、次の候補の分布を表示しています。` : "初期入力に対する次のトークン候補を表示しています。";
    const focused = document.activeElement;
    if (focused instanceof HTMLButtonElement && root.contains(focused) && (focused.hidden || focused.disabled)) {
      const target = candidates.length ? candidateButtons[0] : root.querySelector<HTMLButtonElement>('[data-action="reset"]');
      target?.focus();
    }
  }
  modeSelect.addEventListener("change", () => {
    stop();
    mode = modeSelect.value === "sampling" ? "sampling" : "greedy";
    layout.status.textContent = `${mode === "greedy" ? "最大確率方式" : "サンプリング方式"}に変更しました。現在の文章から続けます。`;
  }, { signal: abort.signal });
  candidateButtons.forEach((button, index) => button.addEventListener("click", () => {
    stop();
    state = selectCandidate(state, index);
    render();
  }, { signal: abort.signal }));
  render();
  return () => { stop(); abort.abort(); layout.dispose(); };
}
