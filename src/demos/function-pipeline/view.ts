import { mountStepLesson } from "../../components/stepLesson";
import { session05Demos } from "../../sessions/session05";
import {
  evaluatePipeline,
  moveBlock,
  operationNames,
  originalInput,
  type ListOperation,
} from "./model";
const defaultOrder: readonly ListOperation[] = ["double", "increment", "even"];
const format = (values: readonly number[]) => `[${values.join(", ")}]`;
export function mountPipeline(root: HTMLElement): () => void {
  let order = [...defaultOrder];
  let enabled = new Set<ListOperation>(["double", "increment"]);
  const abort = new AbortController();
  const layout = mountStepLesson(root, session05Demos[1], () => {
    order = [...defaultOrder];
    enabled = new Set(["double", "increment"]);
    rebuild();
  });
  layout.instructions.textContent =
    "処理をチェックで選び、上へ／下へで順番を変えます。1ステップで途中の配列を確認しましょう。変更すると初期状態へ戻ります。合計は配列を1つの数にするため末尾に固定しています。";
  layout.body.innerHTML = `<p class="goal">元のデータ（変更しません）：<strong id="pipeline-input">[1, 2, 3]</strong></p><div id="pipeline-blocks"></div><p class="lesson-panel">最後の処理：合計する（常に有効）</p><div class="lesson-grid"><section class="lesson-panel"><h2>現在の順序を実行</h2><p id="pipeline-progress" class="storage-result"></p><ol id="pipeline-trace" class="lesson-trace"></ol></section><section class="lesson-panel"><h2>順序による違いを比較</h2><p class="hint">ここは全処理を終えた結果の比較です。</p><div id="pipeline-compare"></div></section></div><details><summary>予想：2倍してから1を足す場合と、1を足してから2倍する場合は？</summary><p>[1,2,3] → 2倍 → [2,4,6] → +1 → [3,5,7] → 合計15。順序を逆にすると[1,2,3] → +1 → [2,3,4] → 2倍 → [4,6,8] → 合計18です。</p></details><p>純粋な関数では、同じ入力なら同じ出力となり、外部の状態を書き換えません。このデモも処理ごとに新しい配列を作り、元の[1,2,3]を残しています。空の配列の合計は0です。</p>`;
  const blocks = root.querySelector<HTMLElement>("#pipeline-blocks")!;
  function rebuild(focusId?: string) {
    blocks.innerHTML = order
      .map(
        (op, i) =>
          `<div class="pipeline-block"><label class="check"><input type="checkbox" data-op="${op}" ${enabled.has(op) ? "checked" : ""}>${operationNames[op]}</label><div class="transport"><button id="up-${op}" data-move="-1" data-op="${op}" ${i === 0 ? "disabled" : ""} aria-label="${operationNames[op]}を上へ">上へ</button><button id="down-${op}" data-move="1" data-op="${op}" ${i === order.length - 1 ? "disabled" : ""} aria-label="${operationNames[op]}を下へ">下へ</button></div></div>`,
      )
      .join("");
    const active = order.filter((op) => enabled.has(op));
    const current = evaluatePipeline(originalInput, active),
      reverse = [...active].reverse(),
      comparison = evaluatePipeline(originalInput, reverse);
    root.querySelector("#pipeline-compare")!.innerHTML =
      `<p>現在：${active.map((op) => operationNames[op]).join(" → ") || "配列そのまま"} → 合計 <strong>${current.result}</strong></p><p>逆順：${reverse.map((op) => operationNames[op]).join(" → ") || "配列そのまま"} → 合計 <strong>${comparison.result}</strong></p><p class="hint">選んだ処理によっては、順序を変えても同じ結果になります。</p>`;
    layout.setFrames(current.frames.length + 1, (index) => {
      const finished = index === current.frames.length;
      root.querySelector("#pipeline-progress")!.textContent = finished
        ? `合計 = ${current.result}（完了）`
        : `${index} / ${current.frames.length} 処理完了`;
      root.querySelector("#pipeline-trace")!.innerHTML =
        current.frames
          .slice(0, index + 1)
          .map(
            (f, i) =>
              `<li ${i === index ? 'aria-current="step"' : ""}>${f.label} → ${format(f.values)}</li>`,
          )
          .join("") +
        (finished
          ? `<li aria-current="step">合計する → ${current.result}</li>`
          : "");
      layout.status.textContent = finished
        ? `各処理の結果を合計し、${current.result}になりました。元の配列は[1,2,3]のままです。`
        : `${current.frames[index]!.label}：${format(current.frames[index]!.values)}。${index === 0 ? "次は最初の有効な処理を行います。" : "新しい配列を次の処理に渡します。"}`;
    });
    if (focusId) {
      const button = root.querySelector<HTMLButtonElement>(`#${focusId}`);
      if (button && !button.disabled) button.focus();
      else
        blocks
          .querySelector<HTMLInputElement>(
            `input[data-op="${focusId.split("-")[1]}"]`,
          )
          ?.focus();
    }
  }
  blocks.addEventListener(
    "change",
    (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) return;
      const op = order.find((item) => item === input.dataset.op);
      if (!op) return;
      if (input.checked) enabled.add(op);
      else enabled.delete(op);
      rebuild();
      blocks.querySelector<HTMLInputElement>(`input[data-op="${op}"]`)!.focus();
    },
    { signal: abort.signal },
  );
  blocks.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>("button[data-move]");
      if (!button) return;
      const index = order.findIndex((item) => item === button.dataset.op);
      if (index < 0) return;
      order = moveBlock(order, index, button.dataset.move === "-1" ? -1 : 1);
      rebuild(button.id);
    },
    { signal: abort.signal },
  );
  rebuild();
  return () => {
    abort.abort();
    layout.dispose();
  };
}
