import { mountStepLesson } from "../../components/stepLesson";
import { session06Config, session06Demos } from "../../sessions/session06";
import {
  initial,
  names,
  facts,
  infer,
  clauses,
  queryText,
  type Query,
  type Member,
  type Predicate,
} from "./model";
export function mountFamily(root: HTMLElement) {
  const abort = new AbortController();
  const l = mountStepLesson(
    root,
    session06Demos[8],
    () => {
      pred.value = initial.pred;
      from.value = initial.from;
      to.value = initial.to;
      restart();
    },
    session06Config,
  );
  l.instructions.textContent =
    "問い合わせを選び、「1ステップ」で家族図のどの辺を照合したかを追います。第2引数を変数 Y にすると、当てはまる人を順に列挙します。";
  const options = Object.entries(names)
    .map(([id, n]) => `<option value="${id}">${n}（${id}）</option>`)
    .join("");
  l.body.innerHTML = `<section class="lesson-panel"><h2>問い合わせを組み立てる</h2><div class="transport"><label class="lesson-field">関係<select data-pred><option value="ancestor">ancestor：祖先</option><option value="grandparent">grandparent：祖父母</option></select></label><label class="lesson-field">第1引数<select data-from>${options}</select></label><label class="lesson-field">第2引数<select data-to><option value="Y">変数 Y（全員を探す）</option>${options}</select></label></div><pre data-query></pre><p>ancestor(taro, Y) は「太郎が祖先にあたる人 Y は誰か」、つまり太郎の子孫を尋ねます。</p></section><div class="lesson-grid"><section class="lesson-panel"><h2>親子の事実と家族図</h2><pre>${facts.map((f) => `parent(${f.parent}, ${f.child}).`).join("\n")}</pre><ol class="family-edges" data-edges></ol></section><section class="lesson-panel"><h2>使う規則</h2><div data-rules></div><p>祖父母は親子の辺をちょうど2本たどります。祖先には親も含まれ、子から同じ規則を繰り返すと、さらに下の世代に届きます。</p><p>変数は規則を呼ぶたびに新しくなります。規則の中の Y と、問い合わせの答えを受け取る Y は別です。</p></section></div><h2>問い合わせの答え</h2><p data-result class="storage-result"></p><h2>照合の履歴</h2><ol class="lesson-trace" data-log></ol><p class="hint">登録した家族と上の規則を試す教材です。一般のPrologプログラムを実行する処理系ではありません。</p>`;
  const select = (id: string) =>
    l.body.querySelector<HTMLSelectElement>("select[data-" + id + "]")!;
  const pred = select("pred"),
    from = select("from"),
    to = select("to");
  function restart() {
    const q: Query = {
      pred: pred.value as Predicate,
      from: from.value as Member,
      to: to.value as Query["to"],
    };
    l.body.querySelector("[data-query]")!.textContent = queryText(q);
    const frames = infer(q);
    l.setFrames(frames.length, (i) => {
      const f = frames[i]!;
      l.body.querySelector("[data-rules]")!.innerHTML = Object.entries(clauses)
        .filter(([k]) =>
          q.pred === "ancestor" ? k !== "grand" : k === "grand",
        )
        .map(([k, v]) => `<pre>${k === f.rule ? "▶ 照合中\n" : ""}${v}</pre>`)
        .join("");
      l.body.querySelector("[data-edges]")!.innerHTML = facts
        .map(
          (e, j) =>
            `<li class="${f.edges.includes(j) ? "active" : ""}">${names[e.parent]} ─親→ ${names[e.child]}${f.edges.includes(j) ? "<strong>✓ この経路で照合</strong>" : ""}</li>`,
        )
        .join("");
      l.body.querySelector("[data-result]")!.textContent =
        q.to === "Y" && f.answers.length
          ? f.answers.map((a) => "Y = " + a).join(" ／ ") +
            (f.done ? "（列挙終了）" : "（探索中）")
          : f.answers.length
            ? "true（成立）"
            : f.done
              ? "false（登録知識では導けない）"
              : "探索中：まだ解は見つかっていません";
      l.body.querySelector("[data-log]")!.innerHTML = frames
        .slice(0, i + 1)
        .map(
          (v, j) =>
            `<li ${i === j ? 'aria-current="step"' : ""}>${v.message}</li>`,
        )
        .join("");
      l.status.textContent = f.message;
    });
  }
  for (const s of [pred, from, to])
    s.addEventListener("change", restart, { signal: abort.signal });
  restart();
  return () => {
    abort.abort();
    l.dispose();
  };
}
