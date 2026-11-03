import { mountStepLesson } from "../../components/stepLesson";
import { session06Demos, session06Config } from "../../sessions/session06";
import {
  start,
  cross,
  solution,
  finished,
  type Load,
  type State,
} from "./model";
const manifest = (l: Load) => `看守${l.g}人・囚人${l.p}人`;
export function mountRiver(root: HTMLElement) {
  let s: State = start,
    history: string[] = [];
  const abort = new AbortController();
  const l = mountStepLesson(
    root,
    session06Demos[4],
    () => {
      s = start;
      history = [];
      g.value = "0";
      p.value = "0";
      planFromHere("左岸から出発します。");
    },
    session06Config,
  );
  l.instructions.textContent =
    "看守3人と囚人3人を右岸へ移しましょう。船には1〜2人が乗れ、誰でも漕げます。どちらの岸でも、看守がいる場合は囚人が看守より多くならないようにします。看守が0人の岸は安全です。「1ステップ」と「1手進める」は現在の状態から最短解を1回分進めます。「自動実行」は全員が渡ると停止します。";
  const select = (id: string, label: string) =>
    `<label class="lesson-field">${label}<select id="${id}">${[0, 1, 2, 3].map((n) => `<option value="${n}">${n}人</option>`).join("")}</select></label>`;
  l.body.innerHTML = `<div class="lesson-grid" data-banks></div><section class="lesson-panel"><h2>船に乗る人</h2><div class="transport">${select("river-g", "看守")}${select("river-p", "囚人")}<button data-act="go">渡航する</button></div><div class="transport"><button data-act="hint">ヒント</button><button data-act="step">1手進める</button><button data-act="answer">解答を表示</button></div><p data-feedback role="status"></p></section><div data-answer></div><h2>渡航履歴</h2><ol class="lesson-trace" data-history></ol><p>状態は（左岸の看守数、左岸の囚人数、船の岸）で表せます。右岸の人数は全体から引けば決まります。ヒントと解答は、現在の状態から幅優先探索で求めます。</p>`;
  const g = l.body.querySelector<HTMLSelectElement>("#river-g")!,
    p = l.body.querySelector<HTMLSelectElement>("#river-p")!;
  const feedback = l.body.querySelector("[data-feedback]")!,
    answer = l.body.querySelector("[data-answer]")!;
  function render(message: string) {
    l.body.querySelector("[data-banks]")!.innerHTML = (["左", "右"] as const)
      .map((side) => {
        const a = side === "左" ? s.guards : 3 - s.guards,
          b = side === "左" ? s.prisoners : 3 - s.prisoners;
        return `<section class="lesson-panel s6-bank"><h2>${side}岸 ${side === s.side ? "⛵ 船はこちら" : ""}</h2><p>看守 <strong>${a}人</strong> <span aria-hidden="true">${"●".repeat(a)}</span></p><p>囚人 <strong>${b}人</strong> <span aria-hidden="true">${"▲".repeat(b)}</span></p></section>`;
      })
      .join("");
    l.status.textContent = `${history.length}回渡航。状態：（${s.guards}, ${s.prisoners}, ${s.side}）。${finished(s) ? "全員が右岸に到着しました。" : ""}`;
    l.body.querySelector("[data-history]")!.innerHTML = history
      .map((h) => `<li>${h}</li>`)
      .join("");
    answer.replaceChildren();
    feedback.textContent = message;
    for (const btn of l.body.querySelectorAll<HTMLButtonElement>(
      "button[data-act]",
    ))
      btn.disabled = finished(s);
  }
  function move(load: Load) {
    const r = cross(s, load);
    if (!r.ok) {
      return "渡れません：" + r.reason;
    }
    history.push(`${s.side}→${r.state.side}：${manifest(load)}`);
    s = r.state;
    return finished(s) ? "全員が右岸に到着しました。" : "安全に渡れました。";
  }
  function planFromHere(message: string) {
    const path = solution(s) ?? [];
    l.setFrames(path.length + 1, (index) => {
      render(index === 0 ? message : move(path[index - 1]!));
    });
  }
  l.body.addEventListener(
    "click",
    (e) => {
      if (!(e.target instanceof HTMLButtonElement) || finished(s)) return;
      const act = e.target.dataset.act;
      if (act === "go") {
        planFromHere(move({ g: Number(g.value), p: Number(p.value) }));
        return;
      }
      const path = solution(s);
      if (!path?.length) return;
      if (act === "step") planFromHere(move(path[0]!));
      else if (act === "hint")
        feedback.textContent = `次は${s.side}岸から${manifest(path[0]!)}で渡れます。残り最少${path.length}回です。`;
      else if (act === "answer") {
        answer.innerHTML = `<section class="lesson-panel"><h2>ここからの最短解：${path.length}回</h2><ol>${path.map((l, i) => `<li>${(i % 2 === 0) === (s.side === "左") ? "左→右" : "右→左"}：${manifest(l)}</li>`).join("")}</ol></section>`;
        feedback.textContent =
          "下に最短解を表示しました。現在の状態は変わりません。";
      }
    },
    { signal: abort.signal },
  );
  planFromHere("左岸から出発します。");
  return () => {
    abort.abort();
    l.dispose();
  };
}
