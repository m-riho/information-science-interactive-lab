import { mountLlm, escapeHtml } from "../llm-common/view";
import type { TokenInfo } from "./model";

export function mountTokenizer(root: HTMLElement): () => void {
  const abort = new AbortController();
  let disposed = false;
  let model: typeof import("./model") | undefined;
  let tokens: TokenInfo[] = [];
  let selected = 0;
  const initialText = "今日は雨なので、傘を持って出かけます。";
  const layout = mountLlm(root, "tokenizer", "文章を入力して「分割する」を押します。トークンを選ぶと、IDと元のバイト列を確認できます。", {
    reset: () => { input.value = initialText; analyze(); },
  });
  layout.body.innerHTML = `<section class="llm-panel"><h2>文章からトークンへ</h2><p>実計算 · js-tiktoken 1.0.21 / o200k_base。スライド9の tiktoken 0.12.0 の例と照合しています。</p>
    <label for="tokenizer-text">入力文章（最大1000文字）</label><textarea id="tokenizer-text" maxlength="1000">${initialText}</textarea>
    <button data-analyze disabled>分割する</button><button data-japanese>日本語例</button><button data-english>英語例</button>
    <p data-count></p><div class="llm-tokens" data-tokens></div></section>
    <section class="llm-panel"><h2>選択したトークン</h2><div data-details></div></section>
    <p>1つの囲みが1トークンです。空白は ␠、改行は ↵ と表示します。単独でUTF-8として読めないトークンは、0xから始まるバイト列を表示します。</p>
    <p>「傘」は e5 82 と 98 に分かれます。連結すると e5 82 98 となり「傘」に戻ります。トークンは単語や文字と一致するとは限りません。IDは識別番号で、大小が意味の強弱を表すものではありません。</p>
    <details><summary>実装と出典</summary><p>語彙とBPEの計算は同梱したライブラリを使用します。入力文章はこのブラウザ内で処理します。特殊トークンを表す文字列も普通の文字列として分割します。</p><p><a href="https://github.com/dqbd/tiktoken/tree/main/js">js-tiktoken</a> · <a href="https://github.com/openai/tiktoken">OpenAI tiktoken</a></p></details>`;
  const input = layout.body.querySelector<HTMLTextAreaElement>("textarea")!;
  const button = layout.body.querySelector<HTMLButtonElement>("[data-analyze]")!;
  const list = layout.body.querySelector<HTMLElement>("[data-tokens]")!;
  const details = layout.body.querySelector<HTMLElement>("[data-details]")!;
  function showSelection() {
    const token = tokens[selected];
    list.querySelectorAll<HTMLButtonElement>("button").forEach((item, index) => item.setAttribute("aria-pressed", String(index === selected)));
    details.innerHTML = token ? `<p>位置 ${selected + 1} / ID <strong>${token.id}</strong></p><p>バイト列（16進数） <code>${token.hex}</code></p><p>単独でUTF-8として表示 ${token.text === null ? "不可（文字の途中で分割）" : "可能"}</p>${token.text === null ? "" : `<pre>${escapeHtml(token.text)}</pre>`}` : "<p>文章を入力すると、ここにトークンの詳細を表示します。</p>";
  }
  function analyze() {
    if (!model) return;
    try {
      tokens = model.tokenize(input.value);
      selected = 0;
      layout.body.querySelector("[data-count]")!.textContent = `トークン数 ${tokens.length}`;
      list.innerHTML = tokens.map((token, i) => `<button class="llm-token" data-token="${i}" aria-pressed="false"><span>${token.text === null ? "0x" + token.hex.replaceAll(" ", "") : escapeHtml(token.text.replaceAll(" ", "␠").replaceAll("\n", "↵").replaceAll("\t", "⇥"))}</span><small>ID ${token.id}</small></button>`).join("");
      showSelection();
      layout.status.textContent = tokens.length ? `${tokens.length}トークンに分割しました。全バイト列を連結すると入力文章を復元できます。` : "入力は空です。トークン数は0です。";
    } catch (error) {
      tokens = [];
      list.replaceChildren();
      layout.body.querySelector("[data-count]")!.textContent = "";
      showSelection();
      layout.status.textContent = error instanceof Error ? error.message : "分割できませんでした。入力を確認してください。";
    }
  }
  button.addEventListener("click", analyze, { signal: abort.signal });
  input.addEventListener("input", () => { layout.status.textContent = "入力を変更しました。「分割する」で結果を更新してください。"; }, { signal: abort.signal });
  layout.body.querySelector("[data-japanese]")!.addEventListener("click", () => { input.value = initialText; analyze(); }, { signal: abort.signal });
  layout.body.querySelector("[data-english]")!.addEventListener("click", () => { input.value = "It is raining."; analyze(); }, { signal: abort.signal });
  list.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("[data-token]") : null;
    if (!target) return;
    selected = Number(target.dataset.token);
    showSelection();
    layout.status.textContent = `位置 ${selected + 1} のトークンを選びました。`;
  }, { signal: abort.signal });
  layout.status.textContent = "o200k_baseの語彙を読み込んでいます。";
  void import("./model").then(loaded => {
    if (disposed) return;
    model = loaded;
    button.disabled = false;
    analyze();
  }).catch(error => {
    if (!disposed) layout.status.textContent = `語彙を読み込めませんでした。ページを再読み込みしてください。${error instanceof Error ? `（${error.message}）` : ""}`;
  });
  return () => { disposed = true; abort.abort(); layout.dispose(); };
}
