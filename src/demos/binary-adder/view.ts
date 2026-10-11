import { halfAdder, add4 } from "./model";
import type { Bit } from "../logic-gates/model";
export function mountAdder(root: HTMLElement): () => void {
  const bitButtons = (name: string) =>
    [3, 2, 1, 0]
      .map(
        (i) =>
          `<button data-input="${name}" data-bit="${i}" aria-label="入力${name}の${2 ** i}の位：0" aria-pressed="false">0</button>`,
      )
      .join("");
  root.innerHTML = `<a class="back" href="#/sessions/03">← 第3回のデモ一覧</a><div class="page-heading"><p class="eyebrow">DEMO 07 / 二進数の計算</p><h1>半加算器と4bit加算器</h1><p class="lead">1 + 1 が 10 になる。繰り上がりを次の桁へつなごう。</p></div>
  <p class="goal"><strong>学習目標</strong>　和と繰り上がりを論理ゲートで説明し、4bitの足し算を各桁の計算に分けられる。</p>
  <section class="lab adder-lab" aria-label="加算器の実験"><div class="lab-bar"><span>入力 → 加算器 → 和と繰り上がり</span><button id="adder-fullscreen">全画面表示</button></div>
  <div class="controls"><label>学習モード<select id="adder-mode"><option value="half">半加算器（1bit）</option><option value="four">4bit加算器</option></select></label>
  <div class="adder-input-grid">${["A", "B"].map((n) => `<fieldset><legend>入力${n}</legend><div class="adder-bits" id="adder-bits-${n}">${bitButtons(n)}</div><p>十進数での値：<output id="adder-value-${n}" aria-label="入力${n}の十進数での値">0</output></p></fieldset>`).join("")}</div>
  <p class="hint">ビットのボタンをクリック・タップ、またはSpace・Enterで切り替えます。入力変更は結果にすぐ反映されます。</p>
  <div class="transport"><button id="adder-preset">1 + 1</button><button id="adder-reset">リセット</button></div></div>
  <div class="adder-result" id="adder-result" role="status"></div>
  <div id="adder-half" class="logic-padding"><div id="adder-half-diagram"></div><div id="adder-table"></div></div>
  <div id="adder-four" class="logic-padding" hidden><p>1の位 → 2の位 → 4の位 → 8の位の順に、繰り上がりを渡します。横並びでは右から左、縦並びでは上から下へ進みます。各ブロックは全加算器です。</p><div id="adder-stages" class="adder-stages"></div>
  <div class="transport"><button class="primary" id="adder-play">最初から再生</button><button id="adder-next">1桁ずつ確認</button><label class="check"><input id="adder-reduced" type="checkbox">動きを減らす</label></div><p id="adder-status" role="status"></p><p class="hint">段階表示は計算順を学ぶためのものです。実際の回路の伝播時間は再現していません。上の計算結果は常に完成値です。</p></div></section>
  <div class="learning-grid"><section><p class="eyebrow">OBSERVE</p><h2>予想 → 操作 → 説明</h2><details><summary>① 1 + 1 の和は0なのに、なぜ2になる？</summary><p>その桁の和SUMは0、繰り上がりCARRYは1。繰り上がりを左に書くと10₂で、十進数の2です。</p></details><details><summary>② 7 + 1 では、どこまで繰り上がる？</summary><p>0111₂ + 0001₂ = 01000₂。1の位から2の位、4の位、8の位へ繰り上がりが伝わります。4bitモードのプリセットで追ってみましょう。</p></details><details><summary>③ 15 + 15 は4bitで表せる？</summary><p>1111₂ + 1111₂ = 11110₂（30）。4bitでは最大15なので、結果には5bit必要です。左端の繰り上がりを捨てると14になってしまいます。</p></details></section>
  <section><p class="eyebrow">UNDERSTAND</p><h2>半加算器と全加算器の違い</h2><p>半加算器はAとBの2入力から、和SUMをXOR、繰り上がりCARRYをANDで求めます。下の桁から来た繰り上がりは受け取れません。</p><p>全加算器はA・Bに加えて、前の桁の繰り上がりCinも足します。全加算器を4個つなぐと4bit加算器になります。最初のCinは0です。この教材は符号なし整数0〜15を扱います。</p><details><summary>論理式を見る</summary><p>半加算器：SUM = A XOR B、CARRY = A AND B。</p><p>全加算器：SUM = (A XOR B) XOR Cin、Cout = (A AND B) OR ((A XOR B) AND Cin)。半加算器2個とORで構成できます。</p></details><a href="#/sessions/03/logic-gates">論理ゲートの働きを復習する →</a></section></div>`;
  const get = <T extends HTMLElement>(id: string) =>
    root.querySelector<T>(`#${id}`)!;
  const mode = get<HTMLSelectElement>("adder-mode"),
    reduced = get<HTMLInputElement>("adder-reduced"),
    play = get<HTMLButtonElement>("adder-play");
  const media = matchMedia("(prefers-reduced-motion: reduce)"),
    events = new AbortController();
  reduced.checked = media.matches;
  let a = 0,
    b = 0,
    stage = 4,
    running = false,
    timer: ReturnType<typeof setInterval> | undefined;
  const four = () => mode.value === "four";
  const update = () => {
    get("adder-half").hidden = four();
    get("adder-four").hidden = !four();
    for (const name of ["A", "B"]) {
      const value = name === "A" ? a : b;
      get(`adder-value-${name}`).textContent = String(value);
      root
        .querySelectorAll<HTMLButtonElement>(`[data-input="${name}"]`)
        .forEach((button) => {
          const bit = Number(button.dataset.bit),
            v = (value >> bit) & 1;
          button.hidden = !four() && bit !== 0;
          button.textContent = `${v}`;
          button.setAttribute("aria-pressed", String(v === 1));
          button.setAttribute(
            "aria-label",
            `入力${name}の${2 ** bit}の位：${v}`,
          );
          button.title = `${2 ** bit}の位`;
        });
    }
    get("adder-preset").textContent = four()
      ? "7 + 1（繰り上がりの連鎖）"
      : "1 + 1";
    const r = add4(a, b),
      h = halfAdder(a as Bit, b as Bit);
    const binary = four() ? r.binary : (a + b).toString(2).padStart(2, "0");
    get("adder-result").innerHTML =
      `<strong>${a.toString(2).padStart(four() ? 4 : 1, "0")}₂ + ${b.toString(2).padStart(four() ? 4 : 1, "0")}₂ = ${binary}₂</strong><span>十進数：${a} + ${b} = ${a + b}</span>${four() ? "<small>結果は5bit（左端は最後の繰り上がり）</small>" : `<small>SUM（和）= ${h.sum} ／ CARRY（繰り上がり）= ${h.carry}</small>`}`;
    if (!four()) {
      get("adder-half-diagram").innerHTML =
        `<svg viewBox="0 0 600 260" role="img" aria-label="A=${a}とB=${b}をXORとANDに入力。SUM=${h.sum}、CARRY=${h.carry}"><g fill="none" stroke="#8060A8" stroke-width="2"><path d="M60 70H170V80H250 M170 70V180H250 M60 210H200V110H250 M200 210V210H250 M350 95H450 M350 195H450"/><rect x="250" y="65" width="100" height="60" rx="8"/><rect x="250" y="165" width="100" height="60" rx="8"/></g><g fill="#32184C" font-size="18" text-anchor="middle"><text x="60" y="55">A=${a}</text><text x="60" y="240">B=${b}</text><text x="300" y="102">XOR</text><text x="300" y="202">AND</text><text x="505" y="102">SUM=${h.sum}</text><text x="505" y="202">CARRY=${h.carry}</text></g></svg>`;
      get("adder-table").innerHTML =
        `<table><caption>半加算器の真理値表</caption><thead><tr><th>A</th><th>B</th><th>SUM</th><th>CARRY</th><th>選択</th></tr></thead><tbody>${[
          0, 1, 2, 3,
        ]
          .map((i) => {
            const x = (i >> 1) as Bit,
              y = (i & 1) as Bit,
              v = halfAdder(x, y),
              active = x === a && y === b;
            return `<tr class="${active ? "current" : ""}"><td>${x}</td><td>${y}</td><td>${v.sum}</td><td>${v.carry}</td><td>${active ? "現在" : "—"}</td></tr>`;
          })
          .join("")}</tbody></table>`;
    }
    get("adder-stages").innerHTML = [...r.stages]
      .reverse()
      .map((s) => {
        const done = s.bit < stage;
        return `<section class="adder-stage ${done ? "complete" : ""}"><h3>${2 ** s.bit}の位</h3><p>A=${s.a}　B=${s.b}</p><p>前の桁のCin：${s.bit === 0 ? "0" : s.bit <= stage ? s.carryIn : "?"}</p><div class="adder-block">全加算器</div><p>和SUM：<strong>${done ? s.sum : "?"}</strong></p><p>次の桁へCout：<strong>${done ? s.carry : "?"}</strong></p><small>${done ? `${s.a} + ${s.b} + ${s.carryIn} = ${s.sum + 2 * s.carry}` : "未確認"}</small></section>`;
      })
      .join("");
    play.textContent = running ? "停止" : stage === 4 ? "最初から再生" : "開始";
    play.disabled = reduced.checked;
    get("adder-status").textContent =
      stage === 4
        ? "4桁の計算が完了。左端のCoutが結果の5bit目になります。"
        : `${stage} / 4 桁を確認${running ? "・再生中" : "・停止中"}`;
  };
  const clear = () => {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
  };
  const schedule = () => {
    clear();
    if (running && !document.hidden && !reduced.checked)
      timer = setInterval(() => {
        stage++;
        if (stage >= 4) {
          running = false;
          clear();
        }
        update();
      }, 900);
  };
  const change = () => {
    running = false;
    clear();
    stage = 4;
    update();
  };
  const on = (target: EventTarget, event: string, fn: () => void) =>
    target.addEventListener(event, fn, { signal: events.signal });
  root.querySelectorAll<HTMLButtonElement>("[data-bit]").forEach((button) =>
    on(button, "click", () => {
      const mask = 1 << Number(button.dataset.bit);
      if (button.dataset.input === "A") a ^= mask;
      else b ^= mask;
      change();
    }),
  );
  on(mode, "change", () => {
    a = 0;
    b = 0;
    change();
  });
  on(get("adder-preset"), "click", () => {
    a = four() ? 7 : 1;
    b = 1;
    change();
  });
  on(get("adder-reset"), "click", () => {
    a = 0;
    b = 0;
    mode.value = "half";
    change();
  });
  on(play, "click", () => {
    if (!running && stage === 4) stage = 0;
    running = !running;
    schedule();
    update();
  });
  on(get("adder-next"), "click", () => {
    running = false;
    clear();
    stage = stage === 4 ? 1 : stage + 1;
    update();
  });
  on(reduced, "change", () => {
    running = false;
    clear();
    update();
  });
  on(media, "change", () => {
    reduced.checked = media.matches;
    running = false;
    clear();
    update();
  });
  on(document, "visibilitychange", schedule);
  on(get("adder-fullscreen"), "click", () => {
    void (async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else
          await root
            .querySelector<HTMLElement>(".adder-lab")!
            .requestFullscreen();
      } catch {
        get("adder-result").insertAdjacentHTML(
          "beforeend",
          "<small>このブラウザでは全画面表示を利用できません。</small>",
        );
      }
    })();
  });
  on(document, "fullscreenchange", () => {
    get("adder-fullscreen").textContent = document.fullscreenElement
      ? "全画面を終了"
      : "全画面表示";
  });
  update();
  return () => {
    clear();
    events.abort();
  };
}
