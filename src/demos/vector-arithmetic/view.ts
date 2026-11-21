import { mountExploration } from "../llm-common/exploration";
import { movePoint, type Vector2 } from "../embedding/model";
import { analogy, analogyPoints } from "./model";
import "./style.css";

const stages = ["king", "king − man", "king − man + woman"];
const fmt = (v: Vector2) => `(${v.x.toFixed(1)}, ${v.y.toFixed(1)})`;

export function mountVectorArithmetic(root: HTMLElement) {
  let points = analogyPoints(), stage = 0, selected = "king";
  let drag: { id: number; min: number; scale: number } | undefined;
  let min = 0, scale = 1;
  const controller = new AbortController();
  const { signal } = controller;
  const layout = mountExploration(root, "vector-arithmetic", "「− man」「＋ woman」の順に押し、矢印の終点がどの語に近づくか予想してください。", {
    reset: () => { stopDrag(); points = analogyPoints(); stage = 0; selected = "king"; render(); }
  });
  layout.body.innerHTML = `<div class="llm-grid"><section class="llm-panel"><h2>単語の地図</h2>
    <svg class="analogy-plot" viewBox="0 0 400 400" role="group" aria-label="単語の座標と、計算でたどった矢印">
    <defs><marker id="analogy-tip" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="context-stroke"/></marker></defs>
    <g data-grid></g><g data-path></g><g data-dots>${points.map(p => `<g data-dot="${p.id}" tabindex="0" role="button"><circle r="19" fill="transparent"/><circle class="dot" r="5"/><text x="8" y="-10">${p.label}</text></g>`).join("")}</g></svg>
    <p class="hint">● 単語　◎ 計算の終点　／　点をドラッグするか、点を選んで矢印キーで移動できます。</p></section>
    <section class="llm-panel"><h2>矢印をたどる</h2><div class="llm-tokens">${["king から出発", "− man", "＋ woman"].map((t,i) => `<button data-stage="${i}">${t}</button>`).join("")}</div>
    <p class="llm-output" data-sum></p><p data-nearest></p>
    <details><summary>単語の座標を変更</summary><label>単語 <select data-word>${points.map(p=>`<option>${p.id}</option>`).join("")}</select></label>
    <label>x <input type="number" min="0" max="10" step="0.1" data-x></label><label>y <input type="number" min="0" max="10" step="0.1" data-y></label></details>
    </section></div><p>座標は授業用に配置した2次元の例です。実際の単語埋め込みでは、語の関係が似た向きとして現れる場合があります。点を動かすと、この例でも結果が変わります。</p>`;
  const body = layout.body;
  const svg = body.querySelector("svg")!;
  const word = body.querySelector<HTMLSelectElement>("[data-word]")!;
  const xInput = body.querySelector<HTMLInputElement>("[data-x]")!;
  const yInput = body.querySelector<HTMLInputElement>("[data-y]")!;
  function stopDrag() {
    const id = drag?.id;
    drag = undefined;
    if (id !== undefined && svg.hasPointerCapture(id)) svg.releasePointerCapture(id);
  }
  function render() {
    const { path, candidates } = analogy(points);
    const values = path.slice(0, stage+2).flatMap(p => [p.x, p.y]);
    min = drag?.min ?? Math.min(0, Math.floor(Math.min(...values) / 2) * 2);
    const max = Math.max(10, Math.ceil(Math.max(...values) / 2) * 2);
    scale = drag?.scale ?? 316 / (max - min);
    const x = (v: number) => 36 + (v-min)*scale;
    const y = (v: number) => 360 - (v-min)*scale;
    const grid = [];
    for (let i=min; i <= min + 316/scale + .01; i += 2) grid.push(`<path d="M${x(i)} 44V360 M36 ${y(i)}H352" stroke="#e2dbe6"/><text x="${x(i)}" y="380" text-anchor="middle">${i}</text><text x="25" y="${y(i)+4}" text-anchor="end">${i}</text>`);
    body.querySelector("[data-grid]")!.innerHTML = grid.join("") + `<path d="M${x(0)} 44V360 M36 ${y(0)}H352" stroke="#7c7383" fill="none"/><text x="365" y="380">x</text><text x="20" y="31">y</text>`;
    const end = path[stage+1]!;
    const colors = ["#82768a","#9b571b","#522576"];
    body.querySelector("[data-path]")!.innerHTML = path.slice(1,stage+2).map((to,i) => {
      const from = path[i]!;
      return `<line x1="${x(from.x)}" y1="${y(from.y)}" x2="${x(to.x)}" y2="${y(to.y)}" stroke="${colors[i]}" stroke-width="3" marker-end="url(#analogy-tip)"/>`;
    }).join("") + `<circle cx="${x(end.x)}" cy="${y(end.y)}" r="9" fill="none" stroke="#522576" stroke-width="3"/>`;
    for (const p of points) {
      const dot = svg.querySelector<SVGGElement>(`[data-dot="${p.id}"]`)!;
      dot.setAttribute("transform", `translate(${x(p.x)} ${y(p.y)})`);
      dot.setAttribute("aria-label", `${p.label} ${fmt(p)}、矢印キーで移動`);
      dot.setAttribute("aria-pressed", String(p.id === selected));
      const label = dot.querySelector("text")!;
      label.setAttribute("text-anchor", x(p.x)>327 ? "end" : "start");
      label.setAttribute("x", x(p.x)>327 ? "-8" : "8");
    }
    for (const button of body.querySelectorAll<HTMLButtonElement>("[data-stage]")) button.setAttribute("aria-pressed", String(Number(button.dataset.stage) === stage));
    body.querySelector("[data-sum]")!.textContent = `${stages[stage]} = ${fmt(end)}`;
    body.querySelector("[data-nearest]")!.textContent = stage === 2
      ? `終点から近い順（式に使った3語を除く）　${candidates.map(p=>`${p.label}：距離 ${p.distance.toFixed(2)}`).join(" ／ ")}`
      : ["原点から king の位置まで進みます。", "king から、man のベクトルと逆向きに進みました。"][stage]!;
    const current = points.find(p=>p.id===selected)!;
    word.value = selected; xInput.value = String(current.x); yInput.value = String(current.y);
    layout.status.textContent = `${stages[stage]} の終点は ${fmt(end)} です。`;
  }
  function move(x: number,y: number) { points = movePoint(points,selected,x,y); render(); }
  body.addEventListener("click", e => {
    const button = e.target instanceof Element ? e.target.closest<HTMLButtonElement>("[data-stage]") : null;
    if (button) { stage = Number(button.dataset.stage); render(); }
  }, { signal });
  word.addEventListener("change", () => { selected = word.value; render(); }, { signal });
  for (const input of [xInput,yInput]) input.addEventListener("change",()=>move(xInput.valueAsNumber,yInput.valueAsNumber),{signal});
  svg.addEventListener("pointerdown", e => {
    const dot = e.target instanceof Element ? e.target.closest<SVGGElement>("[data-dot]") : null;
    if (!dot?.dataset.dot || e.button !== 0 || drag) return;
    selected = dot.dataset.dot; drag = { id: e.pointerId, min, scale };
    svg.setPointerCapture(e.pointerId); dot.focus(); e.preventDefault(); render();
  }, { signal });
  svg.addEventListener("pointermove", e => {
    if (drag?.id !== e.pointerId) return;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const p = new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());
    move(min+(p.x-36)/scale,min+(360-p.y)/scale);
  }, { signal });
  for (const name of ["pointerup","pointercancel","lostpointercapture"] as const) svg.addEventListener(name,e => { if (drag?.id===e.pointerId) { stopDrag(); render(); } }, { signal });
  svg.addEventListener("keydown",e=>{
    const dot = e.target instanceof Element ? e.target.closest<SVGGElement>("[data-dot]") : null;
    if (!dot?.dataset.dot) return;
    const deltas: Record<string,number[]> = { ArrowRight:[.1,0], ArrowLeft:[-.1,0], ArrowUp:[0,.1], ArrowDown:[0,-.1] };
    const d = deltas[e.key];
    if (!d && e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault(); selected = dot.dataset.dot;
    const p = points.find(point=>point.id===selected)!;
    if (d) move(p.x+d[0]!,p.y+d[1]!); else render();
  },{signal});
  render();
  return () => { controller.abort(); stopDrag(); layout.dispose(); };
}
