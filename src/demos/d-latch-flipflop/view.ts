import { mountDemoLayout } from "../../components/demoLayout";
import { session04Demos } from "../../sessions/session04";
import { initialClock, clockNext, type ClockState } from "./model";
import type { Bit } from "../logic-gates/model";
const HALF_CYCLE_MS = 750,
  MAX_AUTO_STEPS = 120,
  HISTORY_LIMIT = 24;
interface Sample extends ClockState {
  index: number;
}
function chart(samples: Sample[], key: "latch" | "ff"): string {
  const width = 600,
    height = 210,
    left = 65,
    step = 520 / Math.max(1, samples.length);
  const rows = (["d", "clk", key] as const)
    .map((name, row) => {
      const base = 50 + row * 60;
      let path = "";
      samples.forEach((s, i) => {
        const x = left + i * step,
          y = base - s[name] * 25;
        path += i === 0 ? `M${x},${y}` : `H${x}V${y}`;
        path += `H${x + step}`;
      });
      return `<text x="8" y="${base - 10}">${name === "d" ? "D" : name === "clk" ? "CLK" : "Q"}</text><text x="42" y="${base - 22}" font-size="10">1</text><text x="42" y="${base + 3}" font-size="10">0</text><path d="M${left} ${base}H590" stroke="#ddd4e6"/><path d="${path}" fill="none" stroke="#4b286d" stroke-width="3"/>`;
    })
    .join("");
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${key === "latch" ? "Dラッチ" : "Dフリップフロップ"}のD・CLK・Qの履歴。左から操作順。"><g fill="#32184c" font-size="16">${rows}<text x="65" y="205">操作 ${samples[0]?.index} → ${samples.at(-1)?.index}</text></g></svg>`;
}
export function mountClock(root: HTMLElement): () => void {
  let state = initialClock(),
    history: Sample[] = [{ ...state, index: 0 }],
    index = 0,
    timer: ReturnType<typeof setInterval> | undefined,
    autoSteps = 0;
  const events = new AbortController();
  const halt = () => {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
  };
  const layout = mountDemoLayout(root, session04Demos[1], {
    reset: () => {
      halt();
      state = initialClock();
      index = 0;
      history = [{ ...state, index }];
      update("D=0・CLK=0・両方のQ=0に戻しました。");
    },
    step: () => advance(state.d, state.clk === 0 ? 1 : 0),
    start: () => {
      autoSteps = 0;
      timer = setInterval(() => {
        advance(state.d, state.clk === 0 ? 1 : 0);
        if (++autoSteps >= MAX_AUTO_STEPS) {
          halt();
          layout.controls.setRunning(false);
          layout.status.textContent =
            "自動クロックは60周期で停止しました。続ける場合は再開できます。";
        }
      }, HALF_CYCLE_MS);
      layout.status.textContent =
        "自動クロックを開始しました。CLK=1の間にDを切り替えてみましょう。";
    },
    stop: () => {
      halt();
      layout.status.textContent =
        "クロックを停止しました。現在の入力とQは保持しています。";
    },
  });
  layout.instructions.textContent =
    "DとCLKを0/1で切り替え、左右のQを比較します。CLK=1の間にDを変えると違いが分かります。「クロック1周期」は立ち上がりと立ち下がりを順に記録します。";
  layout.body.innerHTML = `<div class="transport storage-inputs"><button id="clock-d" aria-pressed="false">D：0</button><button id="clock-clk" aria-pressed="false">CLK：0</button><button id="clock-cycle">クロック1周期</button></div><div class="storage-compare">${["latch", "ff"].map((key) => `<section><h2>${key === "latch" ? "Dラッチ" : "Dフリップフロップ"}</h2><p>${key === "latch" ? "CLK=1の間はDに追従" : "CLKが0→1の瞬間だけ取り込む"}</p><div class="storage-block" id="block-${key}"></div><div id="chart-${key}"></div></section>`).join("")}</div><p class="hint">チャートは操作順の履歴（最新24点）です。横幅は経過時間を表しません。両方とも同じD・CLKを受け取ります。</p><details><summary>数値の履歴を見る</summary><div class="storage-history" tabindex="0" role="region" aria-label="表。狭い画面では横にスクロールできます。"><table class="storage-table"><thead><tr><th>操作</th><th>D</th><th>CLK</th><th>ラッチQ</th><th>FF Q</th></tr></thead><tbody id="clock-history"></tbody></table></div></details><details><summary>予想：CLK=1のままDを変えると？</summary><p>ラッチのQはDに追従します。FFのQは、次の立ち上がりまで変わりません。「ラッチは開いている間に通す」「FFは瞬間に記憶する」という違いです。</p></details><details><summary>予想：CLK=0でDを変えたら？</summary><p>どちらもQを保持します。次にCLKを1へ切り替えると両方がDを取り込みます。</p></details><p class="hint">初期Q=0は教材用の設定です。信号遅延やセットアップ／ホールド時間、メタステーブル状態は扱いません。自動実行は最大60周期で停止します。</p>`;
  const get = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!;
  root.querySelector<HTMLElement>('[data-action="step"]')!.textContent =
    "半周期進める";
  root.querySelector<HTMLElement>('[data-action="start"]')!.textContent =
    "自動クロック";
  const update = (message: string) => {
    for (const key of ["d", "clk"] as const) {
      get(`clock-${key}`).textContent = `${key.toUpperCase()}：${state[key]}`;
      get(`clock-${key}`).setAttribute(
        "aria-pressed",
        String(state[key] === 1),
      );
    }
    for (const key of ["latch", "ff"] as const) {
      get(`block-${key}`).textContent =
        `D=${state.d}　CLK=${state.clk}　→　Q=${state[key]}`;
      get(`chart-${key}`).innerHTML = chart(history, key);
    }
    get("clock-history").innerHTML = history
      .map(
        (s) =>
          `<tr><td>${s.index}</td><td>${s.d}</td><td>${s.clk}</td><td>${s.latch}</td><td>${s.ff}</td></tr>`,
      )
      .join("");
    layout.status.textContent = message;
  };
  function advance(d: Bit, clk: Bit) {
    const rising = state.clk === 0 && clk === 1;
    state = clockNext(state, d, clk);
    history = [...history, { ...state, index: ++index }].slice(-HISTORY_LIMIT);
    update(
      rising
        ? "CLKが0→1：ラッチとFFがDを取り込みました。"
        : clk === 1
          ? "CLK=1：ラッチはDに追従。FFは立ち上がり時の値を保持します。"
          : "CLK=0：ラッチとFFはそれぞれのQを保持します。",
    );
  }
  const manualStop = () => {
    halt();
    layout.controls.setRunning(false);
  };
  get("clock-d").addEventListener(
    "click",
    () => advance(state.d === 0 ? 1 : 0, state.clk),
    { signal: events.signal },
  );
  get("clock-clk").addEventListener(
    "click",
    () => {
      manualStop();
      advance(state.d, state.clk === 0 ? 1 : 0);
    },
    { signal: events.signal },
  );
  get("clock-cycle").addEventListener(
    "click",
    () => {
      manualStop();
      if (state.clk === 1) advance(state.d, 0);
      advance(state.d, 1);
      advance(state.d, 0);
    },
    { signal: events.signal },
  );
  update("初期状態：D=0・CLK=0・両方のQ=0です。");
  return () => {
    halt();
    events.abort();
    layout.dispose();
  };
}
