import { mountStepLesson } from "../../components/stepLesson";
import { session06Config, session06Demos } from "../../sessions/session06";
import { rules, respond } from "./model";
export function mountEliza(root: HTMLElement) {
  const abort = new AbortController();
  const layout = mountStepLesson(
    root,
    session06Demos[9],
    () => {
      input.value = rules[0].example;
      clearHistory();
      prepare();
    },
    session06Config,
  );
  layout.instructions.textContent =
    "文を入力し、Enterまたは「返答を見る」で対話します。「1ステップ」や「自動実行」なら、照合した規則、取り出した言葉、返答の順に観察できます。";
  layout.body.innerHTML = `<form class="lesson-panel"><h2>一文を話しかける</h2><label class="lesson-field">あなたの入力<input type="text" maxlength="160" required autocomplete="off"></label><button type="submit">返答を見る</button></form><details><summary>4つの規則と例文を見る</summary><ol class="lesson-trace">${rules.map((r, i) => `<li>${r.before} X ${r.after} → ${r.template}<br><button type="button" data-example="${i}">例文：${r.example}</button></li>`).join("")}</ol></details><section class="lesson-panel"><h2>返答ができるまで</h2><dl><dt>入力</dt><dd data-input></dd><dt>適用規則</dt><dd data-rule></dd><dt>抽出した X</dt><dd data-x></dd><dt>返答のひな型</dt><dd data-template></dd><dt>ボットの返答</dt><dd data-reply></dd></dl></section><section class="lesson-panel"><h2>対話履歴</h2><ol data-history class="lesson-trace"></ol><button type="button" data-clear>履歴をクリア</button></section><p>文の前後の空白と末尾の句読点（。.!！?？）を除き、上から順に文型を照合します。言い換えて文型が変わると、意味が似ていても一致しないことがあります。</p><p>外部APIや言語モデルを使わず、このブラウザ内で動きます。教育用に作った日本語の規則で、実物のELIZAの完全な再現でも心理相談サービスでもありません。</p>`;
  const get = (selector: string) =>
    layout.body.querySelector<HTMLElement>(selector)!;
  const input = layout.body.querySelector("input")!,
    history = get("[data-history]"),
    clear = layout.body.querySelector<HTMLButtonElement>("[data-clear]")!;
  layout.body.classList.add("eliza-demo");
  const submit =
    layout.body.querySelector<HTMLButtonElement>('[type="submit"]')!;
  function clearHistory() {
    history.replaceChildren();
    clear.disabled = true;
  }
  function prepare(immediate = false) {
    const r = respond(input.value);
    submit.disabled = !r;
    function show(stage: number) {
      get("[data-input]").textContent = input.value || "未入力";
      get("[data-rule]").textContent = stage >= 1 && r ? r.pattern : "未照合";
      get("[data-x]").textContent = stage >= 2 && r ? (r.x ?? "なし") : "—";
      get("[data-template]").textContent =
        stage >= 2 && r ? (r.template ?? "未一致時の定型応答") : "—";
      get("[data-reply]").textContent = stage === 3 && r ? r.reply : "—";
      layout.status.textContent = !r
        ? "例文を選ぶか、一文を入力してください。"
        : [
            "入力を準備しました。",
            r.pattern,
            r.x
              ? "文型の X に当たる部分を取り出しました。"
              : "一致しないため定型応答を使います。",
            "返答を履歴に追加しました。",
          ][stage]!;
      if (stage === 3 && r) {
        const li = document.createElement("li"),
          line = document.createElement("p");
        li.textContent = "あなた：" + r.input;
        line.textContent = "ボット：" + r.reply;
        li.append(line);
        history.append(li);
        clear.disabled = false;
      }
    }
    layout.setFrames(!r || immediate ? 1 : 4, (i) =>
      show(immediate && r ? 3 : i),
    );
  }
  input.value = rules[0].example;
  input.addEventListener("input", () => prepare(), { signal: abort.signal });
  layout.body.querySelector("form")!.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      prepare(true);
    },
    { signal: abort.signal },
  );
  clear.addEventListener(
    "click",
    () => {
      clearHistory();
      prepare();
      layout.status.textContent = "対話履歴を消去しました。";
    },
    { signal: abort.signal },
  );
  for (const b of layout.body.querySelectorAll<HTMLButtonElement>(
    "[data-example]",
  ))
    b.addEventListener(
      "click",
      () => {
        input.value = rules[Number(b.dataset.example)]!.example;
        prepare();
        input.focus();
      },
      { signal: abort.signal },
    );
  clearHistory();
  prepare();
  return () => {
    abort.abort();
    layout.dispose();
  };
}
