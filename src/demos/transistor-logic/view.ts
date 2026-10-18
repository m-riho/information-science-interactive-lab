import { mountDemoLayout } from "../../components/demoLayout";
import { session04Demos } from "../../sessions/session04";
import { transistorState, type TransistorMode } from "./model";
import { nmosStructure } from "./structure";
import { transistorDiagram } from "./diagram";
import type { Bit } from "../logic-gates/model";
export function mountTransistor(root: HTMLElement): () => void {
  let mode: TransistorMode = "mos",
    a: Bit = 0,
    b: Bit = 0,
    abstract = false;
  const events = new AbortController();
  let flowing = false;
  const pauseFlow = () => {
    flowing = false;
    root.querySelector("#trans-structure")?.classList.remove("is-flowing");
  };
  const layout = mountDemoLayout(root, session04Demos[5], {
    start: () => {
      if (mode !== "mos" || abstract || a === 0) {
        layout.controls.setRunning(false);
        return;
      }
      flowing = true;
      get("trans-structure").classList.add("is-flowing");
    },
    stop: pauseFlow,
    reset: () => {
      mode = "mos";
      a = 0;
      b = 0;
      abstract = false;
      get<HTMLSelectElement>("trans-mode").value = "mos";
      get<HTMLInputElement>("trans-abstract").checked = false;
      update();
    },
    step: () => {
      mode = mode === "mos" ? "not" : "nand";
      get<HTMLSelectElement>("trans-mode").value = mode;
      update();
    },
  });
  layout.instructions.textContent =
    "まずGateを切り替えてON/OFFを確認します。次にCMOS NOT、NANDへ進み、各トランジスタの状態と出力を比較しましょう。";
  layout.body.innerHTML = `<label>段階<select id="trans-mode"><option value="mos">1：nMOSスイッチ</option><option value="not">2：CMOS NOT</option><option value="nand">3：CMOS NAND</option></select></label><div class="transport storage-inputs"><button id="trans-a" aria-pressed="false">Gate：0</button><button id="trans-b" aria-pressed="false" hidden>B：0</button><label class="check"><input id="trans-abstract" type="checkbox">抽象化して見る</label></div><div id="trans-structure"></div><div id="trans-figure" class="storage-diagram"></div><p id="trans-output" class="storage-result" role="status"></p><div id="trans-table"></div><p class="hint">トランジスタを理想スイッチで描いた概念図です。ONは接続、OFFは切断。pMOSは入力0でON、nMOSは入力1でON。しきい値・電圧の連続変化・切替時の電流・寄生容量は扱いません。</p><p>複数のトランジスタ → NAND / NOT → 論理ゲート → 加算器・記憶回路 → CPU</p><details><summary>予想：CMOS NOTで入力を1にすると？</summary><p>上のpMOSはOFF、下のnMOSはONとなり、出力がGNDへつながって0になります。入力0では逆に電源へつながり1になります。</p></details><details><summary>予想：NANDでAだけ1なら？</summary><p>下側は直列なのでB側がOFFならGNDへの道が途切れます。上側は並列なのでB側のpMOSがONとなり、出力は1です。AとBの両方1のときだけ出力0になります。</p></details><a href="#/sessions/03/logic-gates">論理ゲートのデモへ →</a>`;
  layout.body.before(root.querySelector<HTMLElement>('[data-slot="controls"]')!);
  const get = <T extends HTMLElement>(id: string) =>
    root.querySelector<T>(`#${id}`)!;
  root.querySelector<HTMLElement>('[data-action="step"]')!.textContent =
    "次の段階";
  root.querySelector<HTMLElement>('[data-action="start"]')!.textContent =
    "電流アニメーション";
  const update = () => {
    const structureVisible = mode === "mos" && !abstract;
    const structure = get("trans-structure");
    structure.hidden = !structureVisible;
    structure.innerHTML = structureVisible ? nmosStructure(a) : "";
    if (!structureVisible || a === 0) {
      pauseFlow();
      layout.controls.setRunning(false);
    }
    structure.classList.toggle("is-flowing", flowing);
    for (const action of ["start", "stop"]) {
      root.querySelector<HTMLButtonElement>(
        `[data-action="${action}"]`,
      )!.hidden = !structureVisible || a === 0;
    }
    const s = transistorState(mode, a, b);
    get("trans-a").textContent = `${mode === "mos" ? "Gate" : "A"}：${a}`;
    get("trans-a").setAttribute("aria-pressed", String(a === 1));
    get("trans-b").textContent = `B：${b}`;
    get("trans-b").setAttribute("aria-pressed", String(b === 1));
    get("trans-b").hidden = mode !== "nand";
    get("trans-figure").innerHTML = abstract
      ? `<div class="abstract-gate"><p>${mode === "mos" ? `Gate=${a}` : `A=${a}${mode === "nand" ? `、B=${b}` : ""}`}</p><strong>${mode === "mos" ? "電気で制御するスイッチ" : mode === "not" ? "NOT" : "NAND"}</strong><p>↓ ${mode === "mos" ? (s.conducting ? "ON：電流あり" : "OFF：電流なし") : "出力 " + s.output}</p></div>`
      : transistorDiagram(mode, a, b);
    get("trans-output").textContent =
      mode === "mos"
        ? `スイッチ${s.conducting ? "ON ／ 負荷を流れる電流あり" : "OFF ／ 電流なし"}`
        : `出力：${s.output} ／ ${s.high ? "電源（1）" : "GND（0）"}につながる`;
    get("trans-table").innerHTML =
      `<table class="storage-table"><thead><tr><th>素子</th><th>種類</th><th>入力</th><th>状態</th></tr></thead><tbody>${s.switches.map((t) => `<tr><td>${t.name}</td><td>${t.type}</td><td>${t.input}=${t.input === "B" ? b : a}</td><td>${t.on ? "ON（接続）" : "OFF（切断）"}</td></tr>`).join("")}</tbody></table>`;
    layout.status.textContent =
      mode === "mos"
        ? "Gateの電気信号で、負荷へ流れる電流の通り道を開閉します。"
        : `出力は${s.output}です。上側と下側のうち一方の経路だけがつながります。理想的な定常状態では、電源からGNDへ流れ続ける電流はありません。`;
    layout.controls.setCompleted(mode === "nand");
    root.querySelector<HTMLButtonElement>('[data-action="start"]')!.disabled ||=
      !structureVisible || a === 0;
  };
  get("trans-a").addEventListener(
    "click",
    () => {
      a = a === 0 ? 1 : 0;
      flowing =
        mode === "mos" &&
        !abstract &&
        a === 1 &&
        !document.hidden &&
        !root.querySelector<HTMLInputElement>('[data-slot="controls"] input')!
          .checked;
      layout.controls.setRunning(flowing);
      update();
    },
    { signal: events.signal },
  );
  get("trans-b").addEventListener(
    "click",
    () => {
      b = b === 0 ? 1 : 0;
      update();
    },
    { signal: events.signal },
  );
  get("trans-mode").addEventListener(
    "change",
    () => {
      mode = get<HTMLSelectElement>("trans-mode").value as TransistorMode;
      update();
    },
    { signal: events.signal },
  );
  get("trans-abstract").addEventListener(
    "change",
    () => {
      abstract = get<HTMLInputElement>("trans-abstract").checked;
      update();
    },
    { signal: events.signal },
  );
  update();
  return () => {
    pauseFlow();
    events.abort();
    layout.dispose();
  };
}
