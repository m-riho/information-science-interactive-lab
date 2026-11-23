import { escapeHtml, mountLlm } from "../llm-common/view";
import {
  DEFAULT_CORPUS, DEFAULT_EXAMPLE, DEFAULT_START, MAX_WORDS,
  advanceGeneration, extractNgrams, initialGeneration, parseSentences, predict,
  splitWords, trainNgram, type Prediction, type SelectionMode, type StopReason,
} from "./model";
import "./style.css";

const UNKNOWN = "この文脈は学習データに存在しないため、単純な頻度推定では次の単語を予測できません";
const LIMIT_EXAMPLE = "太郎 は 昨日 図書館 で 花子 に 会った";
const wordLabel = (word: string | null) => word === null ? "終了（文末）" : word;
const contextLabel = (words: readonly string[]) => words.length ? words.join(" ") : "文脈なし（全体の頻度）";
function reasonText(reason: StopReason): string {
  switch (reason) {
    case "unknown": return UNKNOWN;
    case "short-context": return "文脈の単語が不足しています。直前のn−1単語が必要です。";
    case "empty-corpus": return "学習データが空です。空白で区切った文章を入力して再学習してください。";
    case "eos": return "生成終了：終了記号が選ばれました。終了記号は文章に追加しません。";
    case "limit": return `生成終了：開始文を含めて最大${MAX_WORDS}単語に達しました。`;
    case "start-too-long": return `開始文が${MAX_WORDS}単語を超えています。短くしてから生成してください。`;
    default: return "次の1単語を選べます。";
  }
}
function distributionHtml(prediction: Prediction): string {
  if (prediction.status !== "ready") return `<p class="llm-warning">${reasonText(prediction.status)}</p>`;
  const total = prediction.candidates.reduce((sum, candidate) => sum + candidate.count, 0);
  return `<p>参照する文脈：<strong>${escapeHtml(contextLabel(prediction.context))}</strong> ／ 合計${total}回</p>
    <div class="llm-scroll" tabindex="0" role="region" aria-label="次の単語の出現回数と確率"><table class="ngram-distribution"><caption>次の単語の確率分布（終了を含む）</caption><thead><tr><th scope="col">次の単語</th><th scope="col">出現回数</th><th scope="col">確率</th></tr></thead><tbody>${prediction.candidates.map(candidate => {
      const label = wordLabel(candidate.word);
      const percent = (candidate.probability * 100).toFixed(1);
      return `<tr><th scope="row">${escapeHtml(label)}</th><td>${candidate.count}回</td><td>${candidate.count}/${total} = ${percent}%<svg viewBox="0 0 200 16" role="img" aria-label="${escapeHtml(label)}の確率 ${percent}%"><rect class="ngram-bar-track" width="200" height="16" rx="3"/><rect class="ngram-bar" width="${candidate.probability * 200}" height="16" rx="3"/></svg></td></tr>`;
    }).join("")}</tbody></table></div>`;
}
const quizzes = [
  { question: "3-gramでは、連続する何個の単語を扱いますか？", options: ["2個", "3個", "4個"], correct: 1, explanation: "3-gramは連続する3単語の組です。次の単語の予測に使う直前の文脈は2単語です。" },
  { question: "「雨 が」の後に「降る」が2回、「強い」が1回現れた場合、「降る」の確率はいくつですか？", options: ["1/3", "1/2", "2/3"], correct: 2, explanation: "全3回のうち2回なので、2 ÷ 3 = 2/3（約66.7%）です。" },
  { question: "確率に従って選ぶと、同じ開始文から異なる文章が生成されることはありますか？", options: ["ある", "必ず同じになる"], correct: 0, explanation: "複数の候補に確率があれば、抽選で選ばれる語が変わることがあります。毎回違うとは限りません。" },
  { question: "nを大きくすると、常に文章生成の品質が向上するのでしょうか？", options: ["常に向上する", "必ずしも向上しない"], correct: 1, explanation: "長い文脈を参照できますが、その並びが学習データにないと予測できません。十分なデータが必要です。" },
] as const;
function quizHtml(index: number): string {
  const quiz = quizzes[index]!;
  return `<section class="ngram-quiz" aria-label="確認問題"><h3>確認問題</h3><p>${quiz.question}</p><div role="group" aria-label="回答">${quiz.options.map((option, choice) => `<button type="button" data-quiz="${index}" data-choice="${choice}" aria-pressed="false">${option}</button>`).join("")}</div><p data-feedback="${index}" role="status"></p></section>`;
}

export function mountNgram(root: HTMLElement): () => void {
  let n = 3;
  let corpus = DEFAULT_CORPUS;
  let models = [1, 2, 3, 4, 5].map(order => trainNgram(corpus, order));
  let model = models[n - 1]!;
  let generation = initialGeneration(DEFAULT_START, model);
  let mode: SelectionMode = "greedy";
  let extractionIndex = 0;
  let activeTab = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  const abort = new AbortController();
  const stop = () => {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
    layout.controls.setRunning(false);
  };
  const step = () => {
    generation = advanceGeneration(generation, model, mode, Math.random());
    renderGeneration();
  };
  const layout = mountLlm(root, "ngram", "nと学習データを共有する4つのタブを切り替えて調べます。単語は空白、文章は改行で区切ってください。学習データの編集は「再学習」で反映します。文章生成タブでは1ステップまたは自動生成（1秒ごと）が使えます。", {
    step,
    start: () => { timer = setInterval(step, 1000); },
    stop,
    reset: () => resetAll(),
  });
  const control = (name: string) => root.querySelector<HTMLButtonElement>(`[data-action="${name}"]`)!;
  const controlHost = root.querySelector<HTMLElement>('[data-slot="controls"]')!;
  control("reset").textContent = "初期状態に戻す";
  control("start").textContent = "自動生成";
  control("step").textContent = "1ステップ生成";
  control("stop").textContent = "一時停止";
  layout.body.classList.add("ngram-body");
  layout.body.innerHTML = `<p class="ngram-definition"><strong>n-gram：連続するn個の単語の組</strong><br><strong>n-gram言語モデル：直前のn−1個の単語から次の単語を予測するモデル</strong></p>
    <p class="llm-warning">この教材は<strong>空白で区切った単語単位</strong>のモデルです。実際のLLMで使うトークナイザの分割とは異なります。入力したデータの頻度を実計算します。</p>
    <section class="llm-panel"><h2>共通設定</h2><label>n：<select data-n aria-label="n">${[1, 2, 3, 4, 5].map(order => `<option value="${order}"${order === 3 ? " selected" : ""}>${order}-gram（直前の${order - 1}単語）</option>`).join("")}</select></label>
    <label>学習データ（1行1文・空白区切り、最大12,000文字）<textarea data-corpus maxlength="12000" rows="4"></textarea></label><button type="button" data-train>再学習</button><p data-training role="status"></p>
    <p>各文の終端には内部的な終了記号を付けます。確率には「終了」も含めます。平滑化や、短い文脈への切替（バックオフ）は行いません。</p></section>
    <div class="ngram-tabs" role="tablist" aria-label="n-gramの学習タブ">${["n-gramの抽出", "出現頻度と確率", "n-gramによる文章生成", "n-gramの限界"].map((title, i) => `<button type="button" id="ngram-tab-${i}" role="tab" data-tab="${i}" aria-controls="ngram-panel-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${i + 1}. ${title}</button>`).join("")}</div>
    <section id="ngram-panel-0" role="tabpanel" aria-labelledby="ngram-tab-0" tabindex="0"><h2>n-gramの抽出</h2>
      <label>抽出する文章（空白区切り・改行で別の文）<textarea data-example maxlength="1200" rows="2"></textarea></label><p>抽出練習用の文章です。上の学習データとは別に編集できます。ここでは終了記号を含めません。</p>
      <div class="llm-scroll ngram-window" tabindex="0" role="region" aria-label="単語を囲む抽出枠" data-window></div>
      <button type="button" data-next>次へ</button><button type="button" data-extraction-reset>枠を先頭へ</button><p data-current role="status"></p>
      <div class="llm-scroll" tabindex="0" role="region" aria-label="抽出されたn-gram一覧"><table><caption>同じn-gramをまとめた出現回数</caption><thead><tr><th scope="col">n-gram</th><th scope="col">回数</th></tr></thead><tbody data-grams></tbody></table></div>${quizHtml(0)}</section>
    <section id="ngram-panel-1" role="tabpanel" aria-labelledby="ngram-tab-1" tabindex="0" hidden><h2>出現頻度と確率</h2>
      <label>登録済みの文脈を選ぶ<select data-context-select></select></label><label>文脈を入力して調べる<input data-context type="text" maxlength="1200"></label><p data-context-help></p><div data-frequency></div>
      <p class="ngram-formula">P(次の語 | 文脈) = C(文脈, 次の語) / C(文脈)</p><p>Cは出現回数です。分母はその文脈から次の語または終了を予測する回数、分子は選んだ語が続いた回数です。1-gramは文脈を使わず、終了を含めた全体の頻度から予測します。</p>${quizHtml(1)}</section>
    <section id="ngram-panel-2" role="tabpanel" aria-labelledby="ngram-tab-2" tabindex="0" hidden><h2>n-gramによる文章生成</h2>
      <label>生成開始文（空白区切り）<input data-start type="text" maxlength="1200"></label><label>選択方式<select data-mode><option value="greedy">最大確率による選択</option><option value="sampling">確率に従うサンプリング</option></select></label><button type="button" data-generation-reset>生成を初期化</button>
      <p>「1ステップ生成」「自動生成」「一時停止」で操作します。開始文を含めて最大30単語。同じ最大確率が並ぶ場合は、学習データで先に出た候補を選びます。</p><div data-generation-controls></div>
      <div class="llm-grid"><section class="llm-panel"><h3>現在の文章</h3><p data-generated class="llm-output"></p><p data-generation-status role="status"></p><p data-word-count></p></section><section class="llm-panel"><h3>次の単語の確率分布</h3><div data-generation-distribution></div></section></div>
      <h3>生成履歴</h3><p>各ステップで選んだ語と、その選択時の文脈・確率です。</p><ol data-history></ol>${quizHtml(2)}</section>
    <section id="ngram-panel-3" role="tabpanel" aria-labelledby="ngram-tab-3" tabindex="0" hidden><h2>n-gramの限界</h2>
      <label>文脈長と予測を調べる文章<input data-limit-input type="text" maxlength="1200"></label><p>次の1語を予測するときに参照する範囲を枠で示します。nを変更して比べましょう。</p>
      <div class="llm-scroll ngram-window" tabindex="0" role="region" aria-label="参照する文脈の範囲" data-context-window></div><p data-limit-description></p><div data-limit-distribution></div>
      <div class="llm-scroll" tabindex="0" role="region" aria-label="nによる比較"><table><caption>同じ学習データ・同じ入力でnを比較（終了を予測する文脈も含む）</caption><thead><tr><th scope="col">n</th><th scope="col">参照語数</th><th scope="col">登録文脈数</th><th scope="col">予測できる文脈の例</th><th scope="col">入力末尾の文脈</th><th scope="col">入力の予測可否</th></tr></thead><tbody data-comparison></tbody></table></div>
      <p>nが大きいほど長い並びを区別できますが、その並びの学習例がなければ予測できません。登録文脈の数や生成の品質が、nとともに必ず増えるわけではありません。</p>
      <h3>Transformer型言語モデルとの比較</h3><div class="llm-scroll" tabindex="0" role="region" aria-label="Transformerとの比較"><table><thead><tr><th scope="col">観点</th><th scope="col">n-gram</th><th scope="col">Transformer型言語モデル</th></tr></thead><tbody>
      <tr><th scope="row">次の単語の予測</th><td>可能</td><td>可能（通常はトークン単位）</td></tr><tr><th scope="row">文脈</th><td>直前のn−1単語</td><td>文脈長の範囲</td></tr><tr><th scope="row">予測方法</th><td>出現頻度など</td><td>学習した数値表現</td></tr><tr><th scope="row">離れた情報</th><td>扱いにくい</td><td>Attentionなどで扱える</td></tr></tbody></table></div>
      <p class="llm-warning">どちらも次の単語・トークンを予測する考え方を共有しています。ただしTransformer型LLMは単純なn-gramの頻度表とは異なる方法で文脈を処理します。Transformerでも、長い文脈を常に正しく利用できるわけではありません。</p>${quizHtml(3)}</section>`;
  const get = (selector: string) => layout.body.querySelector<HTMLElement>(selector)!;
  const input = (selector: string) => layout.body.querySelector<HTMLInputElement>(selector)!;
  const select = (selector: string) => layout.body.querySelector<HTMLSelectElement>(selector)!;
  const corpusInput = layout.body.querySelector<HTMLTextAreaElement>("[data-corpus]")!;
  const exampleInput = layout.body.querySelector<HTMLTextAreaElement>("[data-example]")!;
  const tabs = [...layout.body.querySelectorAll<HTMLButtonElement>("[data-tab]")];
  const panels = [...layout.body.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
  const on = (element: EventTarget, event: string, handler: (event: Event) => void) => element.addEventListener(event, handler, { signal: abort.signal });

  function renderTraining() {
    get("[data-training]").textContent = corpusInput.value === corpus
      ? `学習済み：${model.sentenceCount}文 ／ ${n}-gram ／ ${model.contexts.length}種類の文脈。`
      : "未反映の編集があります。「再学習」を押すと全タブに反映され、生成は開始文に戻ります。現在の予測は直前の学習済みデータを使います。";
  }
  function renderExtraction() {
    const sentences = parseSentences(exampleInput.value);
    const windows = sentences.flatMap((words, sentence) => Array.from({ length: Math.max(0, words.length - n + 1) }, (_, start) => ({ sentence, start, words: words.slice(start, start + n) })));
    extractionIndex = Math.max(0, Math.min(extractionIndex, windows.length - 1));
    const current = windows[extractionIndex];
    get("[data-window]").innerHTML = sentences.map((words, sentence) => `<div class="ngram-sentence">${words.map((word, i) => {
      const selected = current?.sentence === sentence && i >= current.start && i < current.start + n;
      return `<span class="ngram-word${selected ? " ngram-in-window" : ""}${selected && i === current.start ? " ngram-window-first" : ""}${selected && i === current.start + n - 1 ? " ngram-window-last" : ""}">${escapeHtml(word)}</span>`;
    }).join("")}</div>`).join("") || "<p>文章を入力してください。</p>";
    get("[data-current]").textContent = current ? `${extractionIndex + 1}/${windows.length}：${current.words.join(" ")}（連続する${n}単語）` : `抽出できる${n}-gramがありません。各文に${n}単語以上が必要です。`;
    const next = layout.body.querySelector<HTMLButtonElement>("[data-next]")!;
    next.disabled = !current || extractionIndex === windows.length - 1;
    const grams = extractNgrams(sentences, n);
    get("[data-grams]").innerHTML = grams.map(gram => `<tr><th scope="row">${escapeHtml(gram.words.join(" "))}</th><td>${gram.count}</td></tr>`).join("") || '<tr><td colspan="2">抽出結果はありません。</td></tr>';
    if (document.activeElement === next && next.disabled) get("[data-extraction-reset]").focus();
  }
  function populateContexts() {
    select("[data-context-select]").innerHTML = '<option value="">文脈を直接入力</option>' + model.contexts.map((entry, i) => `<option value="${i}">${escapeHtml(contextLabel(entry.words))}</option>`).join("");
    input("[data-context]").disabled = n === 1;
    select("[data-context-select]").disabled = n === 1;
    input("[data-context]").value = n === 3 ? "雨 が" : (model.contexts[0]?.words.join(" ") ?? "");
  }
  function renderFrequency() {
    const words = splitWords(input("[data-context]").value);
    const prediction = predict(model, words);
    get("[data-context-help]").textContent = n === 1 ? "1-gramは文脈を参照しません。" : `直前の${n - 1}単語を使います。長い入力では末尾の${n - 1}単語だけを参照します。`;
    get("[data-frequency]").innerHTML = distributionHtml(prediction);
    const index = model.contexts.findIndex(entry => JSON.stringify(entry.words) === JSON.stringify(prediction.context));
    select("[data-context-select]").value = index >= 0 ? String(index) : "";
  }
  function renderGeneration() {
    if (generation.reason) stop();
    layout.controls.setCompleted(generation.reason !== null);
    get("[data-generated]").textContent = generation.words.join(" ") || "（まだ単語がありません）";
    get("[data-word-count]").textContent = `${generation.words.length}/${MAX_WORDS}単語（開始文を含む）`;
    get("[data-generation-status]").textContent = reasonText(generation.reason);
    get("[data-generation-distribution]").innerHTML = generation.reason
      ? `<p>${reasonText(generation.reason)}</p>` : distributionHtml(predict(model, generation.words));
    get("[data-history]").innerHTML = generation.history.map(item => `<li>文脈「${escapeHtml(contextLabel(item.context))}」から <strong>${escapeHtml(wordLabel(item.candidate.word))}</strong> を選択（${(item.candidate.probability * 100).toFixed(1)}%）</li>`).join("") || "<li>まだ生成していません。</li>";
    if (activeTab === 2) layout.status.textContent = generation.reason ? reasonText(generation.reason) : `生成${generation.history.length}ステップ。現在の末尾${n - 1}単語から次の語を予測します。`;
    const focused = document.activeElement;
    if (focused instanceof HTMLButtonElement && root.contains(focused) && focused.disabled) get("[data-generation-reset]").focus();
  }
  function resetGeneration() {
    stop();
    generation = initialGeneration(input("[data-start]").value, model);
    renderGeneration();
  }
  function renderLimits() {
    const words = splitWords(input("[data-limit-input]").value);
    get("[data-context-window]").innerHTML = `<div class="ngram-sentence">${words.map((word, i) => {
      const first = Math.max(0, words.length - n + 1);
      const selected = n > 1 && i >= first;
      return `<span class="ngram-word${selected ? " ngram-in-window" : ""}${selected && i === first ? " ngram-window-first" : ""}${selected && i === words.length - 1 ? " ngram-window-last" : ""}">${escapeHtml(word)}</span>`;
    }).join("")}</div>`;
    get("[data-limit-description]").textContent = n === 1 ? "n=1：直前の単語は参照しません。" : `n=${n}：直前の${n - 1}単語だけを参照します。枠の外の情報は使いません。`;
    get("[data-limit-distribution]").innerHTML = distributionHtml(predict(model, words));
    get("[data-comparison]").innerHTML = models.map(other => {
      const result = predict(other, words);
      return `<tr${other.n === n ? ' class="selected"' : ""}><th scope="row">${other.n}${other.n === n ? "（選択中）" : ""}</th><td>${other.n - 1}</td><td>${other.contexts.length}</td><td>${escapeHtml(other.contexts[0] ? contextLabel(other.contexts[0].words) : "なし")}</td><td>${escapeHtml(contextLabel(result.context))}</td><td>${result.status === "ready" ? "予測できる" : result.status === "short-context" ? "予測できない：語数不足" : result.status === "empty-corpus" ? "予測できない：データなし" : "予測できない：未登録"}</td></tr>`;
    }).join("");
  }
  function activateTab(index: number, focus = false) {
    stop();
    activeTab = index;
    const focusedControl = controlHost.contains(document.activeElement) ? document.activeElement : null;
    if (index === 2) get("[data-generation-controls]").append(controlHost);
    else layout.instructions.after(controlHost);
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i]!.hidden = i !== index;
    });
    for (const name of ["step", "start", "stop"]) control(name).hidden = index !== 2;
    if (focus) tabs[index]?.focus();
    else if (focusedControl instanceof HTMLElement) focusedControl.focus();
    layout.status.textContent = `${tabs[index]!.textContent}を表示しています。学習データとnは全タブ共通です。`;
  }
  function resetAll() {
    stop();
    n = 3; corpus = DEFAULT_CORPUS; mode = "greedy"; extractionIndex = 0;
    models = [1, 2, 3, 4, 5].map(order => trainNgram(corpus, order)); model = models[2]!;
    corpusInput.value = corpus; exampleInput.value = DEFAULT_EXAMPLE;
    input("[data-start]").value = DEFAULT_START; input("[data-limit-input]").value = LIMIT_EXAMPLE;
    select("[data-n]").value = "3"; select("[data-mode]").value = "greedy";
    layout.body.querySelectorAll<HTMLElement>("[data-feedback]").forEach(element => { element.textContent = ""; });
    layout.body.querySelectorAll<HTMLElement>("[data-quiz]").forEach(element => element.setAttribute("aria-pressed", "false"));
    populateContexts(); renderTraining(); renderExtraction(); renderFrequency(); resetGeneration(); renderLimits(); activateTab(0);
  }
  on(select("[data-n]"), "change", () => {
    n = Number(select("[data-n]").value); model = models[n - 1]!; extractionIndex = 0;
    populateContexts(); renderTraining(); renderExtraction(); renderFrequency(); resetGeneration(); renderLimits();
    layout.status.textContent = `${n}-gramに変更しました。生成は開始文に戻りました。`;
  });
  on(corpusInput, "input", renderTraining);
  on(get("[data-train]"), "click", () => {
    corpus = corpusInput.value; models = [1, 2, 3, 4, 5].map(order => trainNgram(corpus, order)); model = models[n - 1]!;
    populateContexts(); renderTraining(); renderFrequency(); resetGeneration(); renderLimits();
    layout.status.textContent = "編集した学習データを全タブに反映しました。生成は開始文に戻りました。";
  });
  on(exampleInput, "input", () => { extractionIndex = 0; renderExtraction(); });
  on(get("[data-next]"), "click", () => { extractionIndex++; renderExtraction(); });
  on(get("[data-extraction-reset]"), "click", () => { extractionIndex = 0; renderExtraction(); });
  on(input("[data-context]"), "input", renderFrequency);
  on(select("[data-context-select]"), "change", () => {
    const value = select("[data-context-select]").value;
    input("[data-context]").value = value === "" ? "" : (model.contexts[Number(value)]?.words.join(" ") ?? ""); renderFrequency();
  });
  on(input("[data-start]"), "input", resetGeneration);
  on(select("[data-mode]"), "change", () => { stop(); mode = select("[data-mode]").value === "sampling" ? "sampling" : "greedy"; });
  on(get("[data-generation-reset]"), "click", resetGeneration);
  on(input("[data-limit-input]"), "input", renderLimits);
  tabs.forEach((tab, index) => {
    on(tab, "click", () => activateTab(index));
    on(tab, "keydown", event => {
      if (!(event instanceof KeyboardEvent)) return;
      const next = event.key === "ArrowRight" ? (index + 1) % 4 : event.key === "ArrowLeft" ? (index + 3) % 4 : event.key === "Home" ? 0 : event.key === "End" ? 3 : undefined;
      if (next !== undefined) { event.preventDefault(); activateTab(next, true); }
    });
  });
  layout.body.querySelectorAll<HTMLButtonElement>("[data-quiz]").forEach(button => on(button, "click", () => {
    const index = Number(button.dataset.quiz); const choice = Number(button.dataset.choice); const quiz = quizzes[index]!;
    layout.body.querySelectorAll<HTMLElement>(`[data-quiz="${index}"]`).forEach(element => element.setAttribute("aria-pressed", String(element === button)));
    get(`[data-feedback="${index}"]`).textContent = `${choice === quiz.correct ? "正解です。" : "不正解です。"}${quiz.explanation}`;
  }));
  resetAll();
  return () => { stop(); abort.abort(); layout.dispose(); };
}
