import { mountStepLesson } from "../../components/stepLesson";
import { session05Demos } from "../../sessions/session05";
import { books, createWebFlow, stageNames, type WebStage } from "./model";
const allStages: readonly WebStage[] = [
  "ready",
  "request",
  "server",
  "php",
  "database",
  "generate",
  "response",
  "browser",
];
export function mountWebRequest(root: HTMLElement): () => void {
  let runtimeAvailable = true;
  const abort = new AbortController();
  const layout = mountStepLesson(root, session05Demos[3], () => {
    runtimeAvailable = true;
    input.value = "情報科学";
    restart();
  });
  layout.instructions.textContent =
    "検索語を入力して、1ステップまたは自動実行で処理の流れを追ってください。「PHP処理系を停止してみる」で検索できない場合を比較できます。検索語や処理系の状態を変えると、最初の段階へ戻ります。";
  layout.body.innerHTML = `<section class="lesson-panel"><h2>架空の図書検索サービス</h2><label class="lesson-field" for="web-query">検索語（書名の一部）<input id="web-query" type="text" maxlength="60" value="情報科学" autocomplete="off"></label><p class="hint">例：情報科学／情報／科学／天文学。空欄は全件検索です。この画面内だけの模擬処理で、検索語を外部へ送信しません。</p><button id="web-runtime" aria-pressed="false">PHP処理系を停止してみる</button><p id="web-runtime-state" class="lesson-value"></p></section><div class="lesson-grid"><section class="lesson-panel"><h2>PHPとは？</h2><p><strong>PHP＝言語の約束</strong>。プログラムをどのように書き、どういう意味で動かすかを定めます。</p></section><section class="lesson-panel"><h2>PHP処理系とは？</h2><p><strong>PHPで書かれたプログラムを動かすソフトウェア</strong>です。言語の約束があっても、処理系が動かなければ検索プログラムを実行できません。</p></section></div><h2>リクエストから表示まで</h2><ol id="web-flow" class="web-flow"></ol><p id="web-progress" class="storage-result"></p><div class="lesson-grid"><section class="lesson-panel"><h2>ブラウザの画面</h2><p id="web-screen-message"></p><ul id="web-results"></ul></section><section class="lesson-panel"><h2>HTTPのやり取り（模式表示）</h2><pre id="web-request"></pre><pre id="web-response"></pre><p class="hint">成功は200、利用不可はこの教材では503としています。実サービスの構成によって障害時の応答は異なります。</p></section></div><details><summary>架空データベースの全3冊を見る</summary><ul>${books.map((book) => `<li>${book.title}</li>`).join("")}</ul><p>書名は架空データです。書名の部分一致だけを扱います。</p></details><details><summary>予想：0件と、処理系が停止している場合は同じ？</summary><p>0件は検索を実行した結果です。処理系停止時は検索自体ができません。この教材ではWebサーバが利用不可の応答を返します。</p></details><h2>処理の履歴</h2><ol id="web-history" class="lesson-trace"></ol>`;
  const input = root.querySelector<HTMLInputElement>("#web-query")!;
  const runtimeButton = root.querySelector<HTMLButtonElement>("#web-runtime")!;
  function restart() {
    const query = input.value;
    const frames = createWebFlow(query, runtimeAvailable);
    runtimeButton.textContent = runtimeAvailable
      ? "PHP処理系を停止してみる"
      : "PHP処理系を再開する";
    runtimeButton.setAttribute("aria-pressed", String(!runtimeAvailable));
    root.querySelector("#web-runtime-state")!.textContent =
      `PHP処理系：${runtimeAvailable ? "稼働中" : "停止中"}（模擬状態）`;
    layout.setFrames(frames.length, (index) => {
      const frame = frames[index]!;
      root.querySelector("#web-flow")!.innerHTML = allStages
        .map((stage, i) => {
          const frameIndex = frames.findIndex((f) => f.stage === stage),
            active = stage === frame.stage;
          const state = active
            ? "現在"
            : frameIndex < 0
              ? "通らない"
              : frameIndex < index
                ? "完了"
                : "待機";
          return `<li ${active ? 'aria-current="step"' : ""}><span>${i + 1}. ${stageNames[stage]}</span><strong>${state}</strong></li>`;
        })
        .join("");
      root.querySelector("#web-progress")!.textContent =
        `${index} / ${frames.length - 1} ステップ：${stageNames[frame.stage]}${index === frames.length - 1 ? "（終了）" : ""}`;
      root.querySelector("#web-request")!.textContent =
        index === 0
          ? "Request：まだ送っていません"
          : `Request：図書の検索を依頼\n検索語：${query.trim() || "（全件）"}`;
      root.querySelector("#web-response")!.textContent =
        frame.status === null
          ? "Response：まだ返っていません"
          : `Response：${frame.status} ${frame.status === 200 ? "OK" : "Service Unavailable"}\n内容：${frame.status === 200 ? "検索結果のHTML" : "利用不可の案内"}`;
      const screen = root.querySelector("#web-screen-message")!,
        results = root.querySelector("#web-results")!;
      results.replaceChildren();
      screen.textContent =
        frame.stage !== "browser"
          ? index === 0
            ? "検索条件を準備しています。"
            : "応答を待っています。検索結果はまだ表示されません。"
          : frame.status === 503
            ? "検索処理を実行できないため、サービスを提供できません。"
            : `「${query.trim() || "全件"}」の検索結果：${frame.results.length}件`;
      if (frame.stage === "browser" && frame.status === 200) {
        for (const book of frame.results) {
          const li = document.createElement("li");
          li.textContent = book.title;
          results.append(li);
        }
        if (frame.results.length === 0) {
          const li = document.createElement("li");
          li.textContent = "一致する書名はありませんでした。";
          results.append(li);
        }
      }
      const history = root.querySelector("#web-history")!;
      history.replaceChildren();
      frames.slice(0, index + 1).forEach((f, i) => {
        const li = document.createElement("li");
        li.textContent = f.message;
        if (i === index) li.setAttribute("aria-current", "step");
        history.append(li);
      });
      layout.status.textContent = frame.message;
    });
  }
  input.addEventListener("input", restart, { signal: abort.signal });
  runtimeButton.addEventListener(
    "click",
    () => {
      runtimeAvailable = !runtimeAvailable;
      restart();
    },
    { signal: abort.signal },
  );
  restart();
  return () => {
    abort.abort();
    layout.dispose();
  };
}
