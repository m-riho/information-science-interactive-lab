import { mountDemoLayout } from "../../components/demoLayout";
import { session04Demos } from "../../sessions/session04";
import { initialMachine, stepMachine, readTape, rules } from "./model";
const STEP_MS = 900;
export function mountTuring(root: HTMLElement): () => void {
  let state = initialMachine(),
    timer: ReturnType<typeof setInterval> | undefined;
  const clear = () => {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
  };
  const layout = mountDemoLayout(root, session04Demos[6], {
    reset: () => {
      clear();
      state = initialMachine();
      layout.controls.setCompleted(false);
      update("最初の1にヘッドを戻しました。状態q0・0ステップから始めます。");
    },
    step: () => advance(),
    start: () => {
      timer = setInterval(advance, STEP_MS);
      update(
        "自動実行中です。読む → 書く → 移動・状態変更を1ステップずつ行います。",
      );
    },
    stop: () => {
      clear();
      update("停止中です。テープ・ヘッド・状態はそのまま保持しています。");
    },
  });
  layout.instructions.textContent =
    "「1ステップ」で規則を1回適用します。1の上では右へ進み、最初の空白に1を書いたら停止します。自動実行でも同じ4ステップをたどります。";
  layout.body.innerHTML = `<p class="goal">課題：111の右端の空白を1に変えて、1111にする。</p><p class="hint">□は空白。ヘッドは▲と枠で示します。位置の数字はセルの目印です。</p><div class="tm-scroll" tabindex="0" role="region" aria-label="テープ表示。狭い画面では横にスクロールできます。"><div id="tm-tape" class="tm-tape"></div></div><p id="tm-state" class="storage-result" role="status"></p><p id="tm-next"></p><div class="storage-history" tabindex="0" role="region" aria-label="表。狭い画面では横にスクロールできます。"><table class="storage-table"><caption>状態遷移表（直前に使った規則を「適用済み」で表示）</caption><thead><tr><th>状態</th><th>読む</th><th>書く</th><th>移動</th><th>次状態</th><th>適用</th></tr></thead><tbody id="tm-rules"></tbody></table></div><p class="hint">テープは概念上、左右に続きます。画面には今回使う範囲だけを表示しています。q1は停止状態で、次の規則はありません。停止した規則で読んだのは「□」ですが、書き込んだ後のヘッド位置には「1」が見えます。</p><details><summary>予想：1が3個なら何ステップで停止する？</summary><p>1を読む3ステップと、空白へ1を書いて停止する1ステップで、合計4ステップです。</p></details><details><summary>予想：停止後にもう一度進めると？</summary><p>q1では実行しません。テープとヘッドを保持します。「リセット」で初期状態に戻して試せます。</p></details><p>単純な規則を順番に適用することで計算が進みます。この固定の例は、1の個数で数を表す単項表現で「1を加える」操作と考えることもできます。</p>`;
  const get = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!;
  // 操作をテープの手前に置き、実行ボタンを探さずに試せるようにする。
  layout.body.before(
    root.querySelector<HTMLElement>('[data-slot="controls"]')!,
  );
  const update = (message: string) => {
    get("tm-tape").innerHTML = Array.from({ length: 7 }, (_, i) => i - 1)
      .map(
        (position) =>
          `<div class="tm-cell ${position === state.head ? "tm-head" : ""}" ${position === state.head ? 'aria-current="location"' : ""}><small>位置 ${position}</small><strong>${readTape(state, position)}</strong><span>${position === state.head ? "▲ ヘッド" : "　"}</span></div>`,
      )
      .join("");
    get("tm-state").textContent =
      `状態：${state.state} ／ ${state.steps}ステップ ／ ヘッド位置：${state.head}${state.halted ? " ／ 実行終了" : timer !== undefined ? " ／ 自動実行中" : " ／ 停止中"}`;
    get("tm-next").textContent = state.halted
      ? "q1：停止状態です。単純な規則を順番に適用することで計算が進みました。"
      : `次に読む記号：${readTape(state, state.head)}。状態q0とこの記号に一致する規則を使います。`;
    get("tm-rules").innerHTML = rules
      .map(
        (rule, i) =>
          `<tr class="${state.lastRule === i ? "current" : ""}"><td>${rule.state}</td><td>${rule.read}</td><td>${rule.write}</td><td>${rule.move}</td><td>${rule.next}</td><td>${state.lastRule === i ? "適用済み" : "—"}</td></tr>`,
      )
      .join("");
    layout.status.textContent = message;
  };
  function advance() {
    const before = state;
    state = stepMachine(state);
    if (state.halted) {
      clear();
      layout.controls.setRunning(false);
      layout.controls.setCompleted(true);
    }
    const rule = state.lastRule === null ? null : rules[state.lastRule];
    update(
      rule
        ? `位置${before.head}で「${rule.read}」を読み、「${rule.write}」を書きました。${rule.move === "右" ? `ヘッドを右の位置${state.head}へ移し、q0を保ちます。` : "ヘッドは動かさず、q1へ移って停止しました。単純な規則を順番に適用することで計算が進みます。"}`
        : "初期状態です。",
    );
  }
  update("初期状態はq0、ヘッドは最初の1、ステップ数は0です。");
  return () => {
    clear();
    layout.dispose();
  };
}
