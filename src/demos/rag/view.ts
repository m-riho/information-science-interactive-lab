import { escapeHtml, mountLlm } from "../llm-common/view";
import { advanceRagStage, documents, prepareAnswer, questions, ragStages, searchDocuments, verifyAnswer, type AnswerMode, type Question, type SourceMode } from "./model";

export function mountRag(root: HTMLElement): () => void {
  let stage = 0;
  const layout = mountLlm(root, "rag", "質問・検索対象・回答例を選び、1ステップずつ検索から照合まで進めます。資料の版を変えて、同じ質問への回答を比較してください。", {
    step: () => { stage = advanceRagStage(stage); render(); },
    reset: () => { question.value = "monday"; sources.value = "all"; answerMode.value = "careful"; restart(); },
  });
  layout.body.innerHTML = `<p class="llm-warning">架空の大学図書館を使った模式的なRAGです。実際の検索サービスやLLMは呼び出しません。回答は事前に用意した文章です。</p>
    <div class="llm-panel"><label>質問<select data-question>${Object.entries(questions).map(([key, value]) => `<option value="${key}">${escapeHtml(value)}</option>`).join("")}</select></label>
    <label>検索対象<select data-sources><option value="all">全資料（新旧の休館案内を含む）</option><option value="old">旧休館案内を使用（新案内Dを除外）</option><option value="latest">最新版（旧案内Bを除外）</option></select></label>
    <label>事前作成の回答例<select data-answer><option value="careful">資料を条件・版に沿って読む例</option><option value="misread">読み違い・条件の取り落としの例</option></select></label>
    <p class="hint">読み違いの例は月曜日・試験期間の質問で比較できます。通常の開館時間と検索0件では回答は変わりません。</p></div>
    <p data-progress class="llm-output"></p><div data-stage></div>
    <details><summary>検索対象の資料をすべて確認する（架空資料）</summary>${documents.map(doc => `<article class="llm-panel"><h3>資料${doc.id}：${escapeHtml(doc.title)}</h3><p>発行：${doc.date}${doc.superseded ? " ／ 旧版" : ""}</p><p>${escapeHtml(doc.text)}</p></article>`).join("")}</details>`;
  const question = layout.body.querySelector<HTMLSelectElement>("[data-question]")!;
  const sources = layout.body.querySelector<HTMLSelectElement>("[data-sources]")!;
  const answerMode = layout.body.querySelector<HTMLSelectElement>("[data-answer]")!;
  const progress = layout.body.querySelector<HTMLElement>("[data-progress]")!;
  const output = layout.body.querySelector<HTMLElement>("[data-stage]")!;
  function restart() { stage = 0; render(); }
  function render() {
    const selected = question.value as Question;
    const docs = searchDocuments(selected, sources.value as SourceMode);
    const answer = prepareAnswer(selected, docs, answerMode.value as AnswerMode);
    const verification = verifyAnswer(selected, docs, answer);
    progress.textContent = `${stage + 1} / 7：${ragStages[stage]}`;
    layout.controls.setCompleted(stage === 6);
    const docCards = docs.map(doc => `<article><h3>資料${doc.id}：${escapeHtml(doc.title)}</h3><p>発行日 ${doc.date}${doc.superseded ? " ／ 旧版・適用期間終了" : ""}</p><p>${escapeHtml(doc.text)}</p></article>`).join("");
    const sections: string[] = [`<section class="llm-panel"><h2>質問</h2><p>${escapeHtml(questions[selected])}</p></section>`];
    if (stage >= 1) sections.push(`<section class="llm-panel"><h2>検索</h2><p>質問の話題タグを使って、選択した資料集合から抽出します。実際の意味検索ではありません。</p></section>`);
    if (stage >= 2) sections.push(`<section class="llm-panel"><h2>検索結果：${docs.length}件</h2>${docCards || "<p>該当資料がありません。検索できたことと、質問に答えられることは別です。</p>"}</section>`);
    if (stage >= 3) sections.push(`<section class="llm-panel"><h2>モデルへ渡す文脈（模式表示）</h2><pre>${escapeHtml(`質問：${questions[selected]}\n参考資料：\n${docs.map(doc => `[資料${doc.id} / ${doc.date}] ${doc.text}`).join("\n") || "なし"}\n指示：出典・適用日・条件を確認し、不明な点は不明と答える。`)}</pre><p>実際のRAGでは、取得した資料を質問と一緒にLLMへ渡します。この教材では外部送信しません。</p></section>`);
    if (stage >= 4) sections.push(`<section class="llm-panel"><h2>事前作成の回答</h2><p class="llm-output">${escapeHtml(answer.text)}</p><p>条件分岐で選んだ文章です。LLMによる生成結果ではありません。</p></section>`);
    if (stage >= 5) sections.push(`<section class="llm-panel"><h2>回答が根拠として挙げた資料</h2>${answer.evidence.length ? answer.evidence.map(id => { const doc = docs.find(item => item.id === id)!; return `<p><strong>資料${id}（${doc.date}）</strong>：${escapeHtml(doc.text)}</p>`; }).join("") : "<p>根拠なし。資料に書かれていない内容を補ってはいけません。</p>"}<p>出典が付いていても、引用内容を正しく読んだとは限りません。</p></section>`);
    if (stage === 6) sections.push(`<section class="llm-panel"><h2>資料・回答の照合</h2><ul>
      <li>根拠：${verification.unsupported ? "該当資料なし。回答の根拠を確認できません。" : "回答が挙げた資料は検索結果に含まれています。"}</li>
      <li>日付・版：${verification.stale ? "旧版Bは2026年3月31日まで。7月の質問には古く、新しい案内を確認する必要があります。" : verification.conflict ? "Bは月曜日休館、Dは月曜日開館。適用時期が異なります。7月の質問には4月1日以後のDを使います。" : "表示された発行日だけでなく、本文の適用期間も確認します。最新版を選ぶだけでは正確性を保証できません。"}</li>
      <li>内容・条件：${verification.misread ? selected === "monday" ? "回答は「休館」ですが、根拠Dは「開館」。資料と回答が一致していません。" : "Cの22時は7月15日〜31日の開館日に限られます。「一年中・毎日」は根拠を超えた回答です。" : selected === "exam" ? "指定日は試験期間内の開館日。22時という回答には、この期間・開館日という条件が必要です。" : selected === "monday" ? "祝日・臨時休館日は例外です。通常日の質問か確認します。" : selected === "hours" ? "20時は通常の平日の案内。試験期間・祝日・臨時休館日は別に確認します。" : "駐車場の情報は登録資料にありません。別の資料や担当窓口で確認が必要です。"}</li>
      </ul><p><strong>検索 → 文脈への追加 → 回答 → 出典・日付・条件の照合。RAGを使っても、正しい回答が保証されるわけではありません。</strong></p></section>`);
    output.innerHTML = sections.join("");
    layout.status.textContent = stage === 6 ? "照合まで完了しました。検索対象や回答例を変えると、質問の段階から比較し直せます。" : `${ragStages[stage]}の段階です。1ステップ進めると${ragStages[stage + 1]}へ進みます。`;
  }
  for (const control of [question, sources, answerMode]) control.addEventListener("change", restart);
  render();
  return () => { for (const control of [question, sources, answerMode]) control.removeEventListener("change", restart); layout.dispose(); };
}
