import { mountStepLesson } from "../../components/stepLesson";
import { session05Demos } from "../../sessions/session05";
import {
  familyFacts,
  inferGrandparent,
  personNames,
  queryPresets,
} from "./model";
export function mountProlog(root: HTMLElement): () => void {
  let preset = 0;
  const abort = new AbortController();
  const layout = mountStepLesson(root, session05Demos[2], () => {
    preset = 0;
    select.value = "0";
    restart();
  });
  layout.instructions.textContent =
    "問い合わせを選び、1ステップずつ事実と規則を照合します。XとZを決め、条件を満たす同じYを探します。強調した矢印が、いま照合した親子関係です。";
  layout.body.innerHTML = `<label class="lesson-field">問い合わせ<select id="prolog-query">${queryPresets.map((q, i) => `<option value="${i}">${q.label}</option>`).join("")}</select></label><div class="lesson-grid"><section class="lesson-panel"><h2>登録された事実</h2><pre>parent(taro, hanako).
parent(hanako, jiro).</pre><div id="prolog-graph"></div></section><section class="lesson-panel"><h2>規則</h2><pre>grandparent(X,Z) :-
    parent(X,Y), parent(Y,Z).</pre><p>Xの子Yの子がZなら、XはZの祖父母です。両方の条件で同じYを使います。</p><p id="prolog-bindings" class="lesson-value"></p></section></div><p id="prolog-result" class="storage-result"></p><ol id="prolog-trace" class="lesson-trace"></ol><details><summary>予想：太郎は花子の祖父母？</summary><p>登録された事実では親ですが、この規則の「2つの親子関係」には一致しません。問い合わせはfalseになります。</p></details><p class="hint">少数の事実と固定の規則を使う教育用推論エンジンです。完全なProlog処理系ではなく、どんな問いでも自動で解けるわけではありません。falseは登録された知識から導けないことを示します。</p>`;
  const select = root.querySelector<HTMLSelectElement>("#prolog-query")!;
  function restart() {
    const query = queryPresets[preset]!;
    const frames = inferGrandparent(query.x, query.z);
    layout.setFrames(frames.length, (index) => {
      const frame = frames[index]!;
      root.querySelector("#prolog-bindings")!.textContent =
        index === 0
          ? `?- grandparent(${query.x}, ${query.z}).`
          : `X=${query.x}、Z=${query.z}、Y=${frame.y ?? "未確定"}`;
      root.querySelector("#prolog-result")!.textContent =
        `${index} / ${frames.length - 1} ステップ：${frame.result === null ? "照合前・照合中" : frame.result ? "true（成立・終了）" : "false（不成立・終了）"}`;
      root.querySelector("#prolog-graph")!.innerHTML =
        `<ol class="family-edges">${familyFacts.map((f, i) => `<li class="${frame.edges.includes(i) ? "active" : ""}">${personNames[f.parent]} ─親→ ${personNames[f.child]} ${frame.edges.includes(i) ? "<strong>✓ 照合した事実</strong>" : ""}</li>`).join("")}</ol>`;
      root.querySelector("#prolog-trace")!.innerHTML = frames
        .slice(0, index + 1)
        .map(
          (f, i) =>
            `<li ${i === index ? 'aria-current="step"' : ""}>${f.message}</li>`,
        )
        .join("");
      layout.status.textContent = frame.message;
    });
  }
  select.addEventListener(
    "change",
    () => {
      preset = Number(select.value);
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
