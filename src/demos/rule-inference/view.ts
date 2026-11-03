import { mountStepLesson } from "../../components/stepLesson";
import { session06Config, session06Demos } from "../../sessions/session06";
import {
  labels,
  rules,
  goal,
  forward,
  backward,
  type Frame,
  type Observation,
} from "./model";
export function mountRules(root: HTMLElement, compare = false) {
  const abort = new AbortController();
  const l = mountStepLesson(
    root,
    session06Demos[compare ? 7 : 6],
    () => {
      select.value = "off";
      restart();
    },
    session06Config,
  );
  l.instructions.textContent = compare
    ? "同じ観察と目標で、前向き・後向きの手順を並べて進めます。「1ステップ」または「自動実行」で、どこから調べ始めるかを比べてください。"
    : "ルーターのランプの状態を選び、「1ステップ」で規則を1つずつ適用してください。観察を変えると最初から試せます。";
  const panel = (id: string, title: string) =>
    `<section class="lesson-panel"><h2>${title}</h2><div data-trace="${id}"></div></section>`;
  l.body.innerHTML = `<section class="lesson-panel"><h2>観察した事実</h2><label class="lesson-field">ルーターのランプ<select><option value="off">消灯</option><option value="on">点灯</option></select></label></section><section class="lesson-panel"><h2>使える規則</h2><ol class="lesson-trace">${rules.map((r) => `<li><strong>${r.id}</strong>：もし「${labels[r.when]}」なら、「${labels[r.then]}」。</li>`).join("")}</ol></section><p class="goal">目標：「${labels[goal]}」という結論を導けるか？</p><div class="${compare ? "lesson-grid" : ""}">${panel("forward", compare ? "前向き：事実から出発" : "規則を使った推論")}${compare ? panel("backward", "後向き：目標から出発") : ""}</div>${compare ? "<p>後向き推論でさかのぼるのは、確かめる順番です。「AならB」という規則を「BならA」と読み替えるわけではありません。</p>" : ""}<p>教育用に単純化したネット接続診断です。点灯時に結論が出ないことは、電源が正常だという証明ではありません。実際の故障原因を保証するものではありません。</p>`;
  const select = l.body.querySelector("select")!;
  function restart() {
    const obs: Observation = select.value === "off" ? "off" : "on";
    const tracks = [
      { id: "forward", frames: forward(obs) },
      ...(compare ? [{ id: "backward", frames: backward(obs) }] : []),
    ];
    l.setFrames(Math.max(...tracks.map((t) => t.frames.length)), (index) => {
      const messages: string[] = [];
      for (const { id, frames } of tracks) {
        const n = Math.min(index, frames.length - 1),
          f: Frame = frames[n]!;
        const verdict =
          f.supported === null
            ? "推論中"
            : f.supported
              ? "目標を支持できた"
              : "この事実・規則からは支持できない";
        l.body.querySelector(`[data-trace="${id}"]`)!.innerHTML =
          `<p class="lesson-value">観察：${labels[obs]}</p>${f.seeking ? `<p>確かめたいこと：${labels[f.seeking]}</p>` : ""}<ol class="lesson-trace">${frames
            .slice(0, n + 1)
            .map(
              (v, j) =>
                `<li ${j === n ? 'aria-current="step"' : ""}>${v.rule ? `<strong>${v.rule}</strong>：` : ""}${v.message}</li>`,
            )
            .join(
              "",
            )}</ol><p>導いた結論：${f.derived.map((k) => labels[k]).join(" ／ ") || "まだありません"}</p><p class="storage-result">${verdict}</p>`;
        messages.push(
          (compare ? (id === "forward" ? "前向き：" : "後向き：") : "") +
            f.message,
        );
      }
      l.status.textContent = messages.join("　");
    });
  }
  select.addEventListener("change", restart, { signal: abort.signal });
  restart();
  return () => {
    abort.abort();
    l.dispose();
  };
}
