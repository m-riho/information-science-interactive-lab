import p5 from "p5";
import {
  evaluateGate,
  nandCircuit,
  explanations,
  type Bit,
  type Gate,
  type NandTarget,
} from "./model";
import { drawCircuit, switchDiagram } from "./diagram";

export function mountLogic(root: HTMLElement): () => void {
  root.innerHTML = `<a class="back" href="#/sessions/03">← 第3回のデモ一覧</a><div class="page-heading"><p class="eyebrow">DEMO 06 / 論理回路</p><h1>論理ゲート・プレイグラウンド</h1><p class="lead">0と1を組み合わせて、判断する回路をつくろう。</p></div>
 <p class="goal"><strong>学習目標</strong>　基本ゲートの働きを真理値表で説明し、NANDだけでNOT・AND・ORを構成できる。</p>
 <section class="lab logic-lab" aria-label="論理ゲートの実験"><div class="lab-bar"><span>入力 → ゲート → 出力</span><button id="logic-fullscreen">全画面表示</button></div>
 <div class="controls"><div class="spatial-options"><label>学習モード<select id="logic-mode"><option value="basic">基本ゲート</option><option value="nand">NANDだけで組み立てる</option></select></label><label>ゲート<select id="logic-gate"><option>AND</option><option>OR</option><option>NOT</option><option>NAND</option><option>XOR</option></select></label></div><p id="logic-explanation"></p>
 <div class="logic-inputs"><button id="logic-a" aria-pressed="false">入力A：0</button><button id="logic-b" aria-pressed="false">入力B：0</button><div id="logic-lamp" class="logic-lamp" role="status">出力：0</div></div></div>
 <div id="logic-canvas" role="group" aria-label="論理回路。入力端子を押すと0と1を切り替えます。"><button id="logic-terminal-a" class="logic-terminal" aria-label="回路図の入力A：0" aria-pressed="false"></button><button id="logic-terminal-b" class="logic-terminal" aria-label="回路図の入力B：0" aria-pressed="false"></button></div><p class="hint logic-padding">入力端子A・Bはクリック・タップでも切り替えられます。配線：実線は1、破線は0または未確認（?）。四角は論理ブロックです。数値は下にも表示します。</p>
 <div id="logic-stages" class="controls" hidden><h2>NAND回路を1段階ずつ追う</h2><ol id="logic-step-list"></ol><div class="transport"><button class="primary" id="logic-play">開始</button><button id="logic-next">次の段階</button><label class="check"><input id="logic-reduced" type="checkbox">動きを減らす</label></div></div>
 <div class="logic-padding"><button id="logic-reset">リセット</button><p class="status" id="logic-status" role="status">入力ボタンはSpace・Enterでも切り替えられます。</p></div>
 <div class="logic-learning"><section><h2>真理値表</h2><p class="hint">現在の入力に対応する行を「現在」で表示。NANDモードでも、完成した回路の出力を示します。</p><div id="logic-table"></div></section><section id="logic-switches"><h2 id="logic-switch-title"></h2><div id="logic-switch-figure"></div><p class="hint">1はスイッチが閉じた状態、0は開いた状態。電流の通り道を示す概念図で、実際のトランジスタ回路ではありません。</p></section></div></section>
 <p class="hint">NANDモードは「NOT（1段）→ AND（2段）→ OR（3段）」の順がおすすめです。入力変更は中間値と出力にすぐ反映されます。「最初から再生」で計算順を確認できます。回路変更は段階表示を最初に戻します。リセットは基本AND・入力0/0に戻します。</p>
 <div class="learning-grid"><section><p class="eyebrow">OBSERVE</p><h2>予想 → 操作 → 説明</h2>
 <details><summary>① ANDとORで、Aだけ1にすると？</summary><p>ANDは0、ORは1になります。直列では両方のスイッチを閉じる必要がありますが、並列では一方が閉じれば通り道ができます。</p></details>
 <details><summary>② ORとXORで、両方1にすると？</summary><p>ORは1、XORは0になります。XORは「どちらか一方だけが1」を表します。真理値表の最後の行で違いを確認しましょう。</p></details>
 <details><summary>③ NANDの両方に同じAを入れると？</summary><p>NANDモードでNOTを選び、Aを切り替えます。Aが0なら出力1、Aが1なら出力0。NANDの2入力をまとめるだけでNOTになります。次はANDとORの中間出力を追ってみましょう。</p></details></section>
 <section><p class="eyebrow">UNDERSTAND</p><h2>なぜそうなる？</h2><p>論理ゲートは0と1を受け取り、決まった規則で0か1を返します。真理値表は入力のすべての組合せと出力をまとめた表です。</p><p>NANDはANDを反転したものです。NANDだけを組み合わせても、ほかの基本ゲートを作れます。段階表示は理解のための計算順であり、実際の信号の伝播時間を再現したものではありません。</p><details><summary>NANDで作る式を見る</summary><p>NOT A = NAND(A, A)</p><p>A AND B = NAND(NAND(A, B), NAND(A, B))</p><p>A OR B = NAND(NAND(A, A), NAND(B, B))。AとBをそれぞれ反転し、そのANDを反転するとORになります（ド・モルガンの法則）。</p></details></section></div>`;
  const find = <T extends HTMLElement>(id: string): T => {
    const e = root.querySelector<T>(`#${id}`);
    if (!e) throw new Error(id);
    return e;
  };
  const host = find<HTMLDivElement>("logic-canvas"),
    mode = find<HTMLSelectElement>("logic-mode"),
    select = find<HTMLSelectElement>("logic-gate");
  const inputA = find<HTMLButtonElement>("logic-a"),
    inputB = find<HTMLButtonElement>("logic-b"),
    play = find<HTMLButtonElement>("logic-play"),
    next = find<HTMLButtonElement>("logic-next"),
    reduced = find<HTMLInputElement>("logic-reduced"),
    status = find("logic-status");
  const events = new AbortController(),
    media = matchMedia("(prefers-reduced-motion: reduce)");
  reduced.checked = media.matches;
  let a: Bit = 0,
    b: Bit = 0,
    stage = 0,
    running = false,
    ready = false,
    disposed = false,
    elapsed = 0,
    previous: number | undefined;
  const gate = () => select.value as Gate;
  const steps = () => nandCircuit(gate() as NandTarget, a, b);
  const update = () => {
    const nand = mode.value === "nand",
      g = gate(),
      not = g === "NOT",
      count = nand ? steps().length : 0;
    inputA.textContent = `入力A：${a}`;
    inputA.setAttribute("aria-pressed", String(a === 1));
    inputB.textContent = not ? "入力B：不使用" : `入力B：${b}`;
    inputB.disabled = not;
    inputB.setAttribute("aria-pressed", String(b === 1));
    for (const [name, value, y] of [
      ["a", a, not ? 160 : nand ? 95 : 110],
      ["b", b, nand ? 225 : 210],
    ] as const) {
      const terminal = find<HTMLButtonElement>(`logic-terminal-${name}`);
      terminal.hidden = name === "b" && not;
      terminal.style.top = `${y - 22}px`;
      terminal.setAttribute("aria-label", `回路図の入力${name.toUpperCase()}：${value}（押すと切替）`);
      terminal.setAttribute("aria-pressed", String(value === 1));
    }
    find("logic-explanation").textContent = explanations[g];
    const output = nand && stage < count ? undefined : evaluateGate(g, a, b);
    find("logic-lamp").textContent =
      output === undefined
        ? "出力：?（未確認）"
        : `出力：${output}（${output ? "点灯" : "消灯"}）`;
    find("logic-lamp").classList.toggle("on", output === 1);
    find("logic-stages").hidden = !nand;
    if (nand)
      find("logic-step-list").innerHTML = steps()
        .map(
          (s, i) =>
            `<li>${s.label}：${i < stage ? `${s.inputs[0]}, ${s.inputs[1]} → ${s.output}` : "?（次の段階で確認）"}</li>`,
        )
        .join("");
    play.textContent = running ? "停止" : nand && stage >= count ? "最初から再生" : "開始";
    play.disabled = reduced.checked || !nand;
    next.disabled = stage >= count;
    const rows = not
      ? [
          [0, 0],
          [1, 0],
        ]
      : [
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
        ];
    find("logic-table").innerHTML =
      `<table><caption>${nand ? "NANDで構成した " : ""}${g}の真理値表</caption><thead><tr><th scope="col">A</th>${not ? "" : '<th scope="col">B</th>'}<th scope="col">出力</th><th scope="col">選択</th></tr></thead><tbody>${rows
        .map(([x, y]) => {
          const current = x === a && (not || y === b);
          return `<tr class="${current ? "current" : ""}"><td>${x}</td>${not ? "" : `<td>${y}</td>`}<td>${evaluateGate(g, x as Bit, y as Bit)}</td><td>${current ? "現在" : "—"}</td></tr>`;
        })
        .join("")}</tbody></table>`;
    find("logic-switches").hidden = g !== "AND" && g !== "OR";
    if (g === "AND" || g === "OR") {
      find("logic-switch-title").textContent =
        g === "AND" ? "直列スイッチ → AND" : "並列スイッチ → OR";
      find("logic-switch-figure").innerHTML = switchDiagram(g, a, b);
    }
  };
  const sketch = new p5((p) => {
    p.setup = () => {
      p.createCanvas(host.clientWidth, 300).parent(host);
      p.pixelDensity(1);
      p.frameRate(20);
      p.noLoop();
      ready = true;
    };
    p.draw = () => {
      if (disposed) return;
      const now = performance.now();
      if (running && !document.hidden && !reduced.checked) {
        if (previous !== undefined) elapsed += now - previous;
        previous = now;
        if (elapsed >= 1000) {
          stage = Math.min(stage + 1, steps().length);
          elapsed = 0;
          status.textContent = `${stage}段階目を確認しました。`;
          if (stage === steps().length) {
            running = false;
            p.noLoop();
          }
          update();
        }
      }
      drawCircuit(p, gate(), a, b, mode.value === "nand", stage);
    };
  }, host);
  const sync = () => {
    previous = undefined;
    if (ready) {
      if (running && !document.hidden && !reduced.checked) sketch.loop();
      else {
        sketch.noLoop();
        if (!document.hidden) sketch.redraw();
      }
    }
    update();
  };
  const listen = (el: EventTarget, name: string, action: () => void) =>
    el.addEventListener(name, action, { signal: events.signal });
  const restart = (showOutput = false) => {
    stage = showOutput && mode.value === "nand" ? steps().length : 0;
    elapsed = 0;
    running = false;
    status.textContent =
      mode.value === "nand"
        ? showOutput ? "入力に合わせて中間出力と最終出力を更新しました。" : "次の段階で中間出力を確認しましょう。"
        : "入力と出力を真理値表で確認しましょう。";
    sync();
  };
  listen(find("logic-terminal-a"), "click", () => inputA.click());
  listen(find("logic-terminal-b"), "click", () => inputB.click());
  listen(inputA, "click", () => {
    a = a === 0 ? 1 : 0;
    restart(true);
  });
  listen(inputB, "click", () => {
    b = b === 0 ? 1 : 0;
    restart(true);
  });
  listen(select, "change", restart);
  listen(mode, "change", () => {
    select.innerHTML = (
      mode.value === "nand"
        ? ["NOT", "AND", "OR"]
        : ["AND", "OR", "NOT", "NAND", "XOR"]
    )
      .map((g) => `<option>${g}</option>`)
      .join("");
    restart();
  });
  listen(next, "click", () => {
    running = false;
    elapsed = 0;
    stage = Math.min(stage + 1, steps().length);
    status.textContent = `${stage}段階目を確認しました。`;
    sync();
  });
  listen(play, "click", () => {
    if (!running && stage >= steps().length) {
      stage = 0;
      elapsed = 0;
    }
    running = !running;
    status.textContent = running
      ? "NANDの出力を順に確認しています。"
      : "停止中";
    sync();
  });
  listen(find("logic-reset"), "click", () => {
    a = 0;
    b = 0;
    mode.value = "basic";
    select.innerHTML = ["AND", "OR", "NOT", "NAND", "XOR"]
      .map((g) => `<option>${g}</option>`)
      .join("");
    restart();
  });
  const reduce = () => {
    if (reduced.checked) {
      running = false;
      status.textContent = "自動再生を停止しました。次の段階ボタンで確認できます。";
    }
    sync();
  };
  listen(reduced, "change", reduce);
  listen(media, "change", () => {
    reduced.checked = media.matches;
    reduce();
  });
  listen(document, "visibilitychange", sync);
  const lab = root.querySelector<HTMLElement>(".logic-lab")!;
  listen(find("logic-fullscreen"), "click", () => {
    void (async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (lab.requestFullscreen) await lab.requestFullscreen();
        else throw new Error("unsupported");
      } catch {
        if (!disposed)
          status.textContent = "このブラウザでは全画面表示を利用できません。";
      }
    })();
  });
  listen(document, "fullscreenchange", () => {
    find("logic-fullscreen").textContent = document.fullscreenElement
      ? "全画面を終了"
      : "全画面表示";
  });
  const observer = new ResizeObserver(() => {
    if (ready && !disposed) sketch.resizeCanvas(host.clientWidth, 300);
  });
  observer.observe(host);
  update();
  return () => {
    disposed = true;
    events.abort();
    observer.disconnect();
    sketch.remove();
  };
}
