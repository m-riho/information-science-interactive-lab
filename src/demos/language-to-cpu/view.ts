import { mountDemoLayout } from "../../components/demoLayout";
import { session04Demos } from "../../sessions/session04";
import { loadTranslation, machineWords } from "./model";
import { runInstruction, instructionText } from "../cpu-cycle/model";
export function mountLanguage(root: HTMLElement): () => void {
  let a = 5,
    b = 8,
    stage = 0,
    hex = false,
    cpu = loadTranslation(a, b);
  const events = new AbortController();
  const layout = mountDemoLayout(root, session04Demos[4], {
    reset: () => {
      a = 5;
      b = 8;
      stage = 0;
      hex = false;
      cpu = loadTranslation(a, b);
      get<HTMLSelectElement>("lang-format").value = "binary";
      update();
    },
    step: () => {
      stage = Math.min(2, stage + 1);
      update();
    },
  });
  layout.instructions.textContent =
    "a・bを設定して「次の段階」または「翻訳」でアセンブリと機械語を確認し、「CPUで実行」で1命令ずつ進めます。入力を変えると翻訳と実行を最初に戻します。";
  layout.body.innerHTML = `<div class="transport"><label>a <input id="lang-a" type="number" min="0" max="15" step="1" value="5"></label><label>b <input id="lang-b" type="number" min="0" max="15" step="1" value="8"></label><button id="lang-translate">翻訳</button><button id="lang-execute">CPUで実行（1命令）</button><label>機械語の表示<select id="lang-format"><option value="binary">2進数</option><option value="hex">16進数</option></select></label></div><p class="hint">a・bは0〜15の整数。ここでは固定の式だけを扱い、任意のプログラムを入力するコンパイラではありません。</p><ol class="translation-flow"><li><h2>人間 → 高水準言語</h2><p>「aとbを足してcへ保存する」</p><pre>c = a + b</pre></li><li><h2>翻訳 → アセンブリ</h2><div id="lang-assembly"></div></li><li><h2>機械語 → CPU</h2><div id="lang-machine"></div></li></ol><p id="lang-cpu" class="storage-result" role="status"></p><div id="lang-memory"></div><p class="hint">教育用仮想命令セットによる概念シミュレーションです。x86/ARMの正確なコンパイラではありません。上位4bitは命令（LOAD=0001、ADD=0010、STORE=0011）、下位4bitはデータ番地です。0000 0000はHALT。命令は08〜11番地、a・b・cは01・02・03番地へ配置します。番地は十進数で表記します。</p><details><summary>予想：機械語の数字だけで足し算ができる？</summary><p>CPUは決められた命令コードを解釈します。ここでは表示した8bitを復号してCPUモデルに渡し、LOAD → ADD → STORE → HALTの順に実行します。</p></details><details><summary>予想：8bitの命令なら、答えも8bit？</summary><p>命令の長さとデータの幅は別の設計です。この教材のCPUは数値を整数として扱い、8bitの桁あふれは再現しません。</p></details>`;
  const get = <T extends HTMLElement>(id: string) =>
    root.querySelector<T>(`#${id}`)!;
  root.querySelector<HTMLElement>('[data-action="step"]')!.textContent =
    "次の段階";
  root.querySelector<HTMLElement>('[data-action="reset"]')!.textContent =
    "最初から";
  const update = () => {
    get<HTMLInputElement>("lang-a").value = String(a);
    get<HTMLInputElement>("lang-b").value = String(b);
    get("lang-assembly").innerHTML =
      stage >= 1
        ? "<pre>LOAD a\nADD b\nSTORE c\nHALT</pre><p>a → 01、b → 02、c → 03番地へ対応付けます。</p>"
        : "<p>「次の段階」または「翻訳」で表示します。</p>";
    get("lang-machine").innerHTML =
      stage >= 2
        ? `<table class="storage-table"><thead><tr><th>命令番地</th><th>機械語</th><th>意味</th></tr></thead><tbody>${machineWords()
            .map((w, i) => {
              const ins = cpu.memory[8 + i];
              const bits = w.toString(2).padStart(8, "0");
              return `<tr class="${cpu.count > 0 && cpu.history.at(-1)?.from === 8 + i ? "current" : ""}"><td>${String(8 + i).padStart(2, "0")}</td><td><code>${hex ? "0x" + w.toString(16).padStart(2, "0").toUpperCase() : bits.slice(0, 4) + " " + bits.slice(4)}</code></td><td>${typeof ins === "object" ? instructionText(ins) : ""}</td></tr>`;
            })
            .join("")}</tbody></table>`
        : "<p>まだ機械語へ翻訳していません。</p>";
    get<HTMLButtonElement>("lang-execute").disabled = stage < 2 || cpu.halted;
    layout.controls.setCompleted(stage >= 2);
    get("lang-cpu").textContent =
      `PC=${String(cpu.pc).padStart(2, "0")}　ACC=${cpu.acc}　c=${cpu.memory[3]}${cpu.halted ? " ／ HALT：実行終了" : ""}`;
    get("lang-memory").textContent =
      `データメモリ：01番地 a=${a}、02番地 b=${b}、03番地 c=${cpu.memory[3]}`;
    layout.status.textContent = cpu.count
      ? cpu.message
      : stage === 0
        ? "まず高水準言語で計算の意図を表します。"
        : stage === 1
          ? "式をLOAD・ADD・STOREに分けました。最後に停止命令HALTを加えます。"
          : "命令と番地を8bitで表しました。CPUで実行できます。";
  };
  for (const name of ["a", "b"])
    get(`lang-${name}`).addEventListener(
      "input",
      () => {
        const input = get<HTMLInputElement>(`lang-${name}`);
        const n = Number(input.value);
        if (!input.value.trim() || !Number.isInteger(n) || n < 0 || n > 15) {
          input.value = String(name === "a" ? a : b);
          layout.status.textContent = "0〜15の整数を入力してください。";
          return;
        }
        if (name === "a") a = n;
        else b = n;
        stage = 0;
        cpu = loadTranslation(a, b);
        update();
      },
      { signal: events.signal },
    );
  get("lang-translate").addEventListener(
    "click",
    () => {
      stage = 2;
      cpu = loadTranslation(a, b);
      update();
    },
    { signal: events.signal },
  );
  get("lang-execute").addEventListener(
    "click",
    () => {
      cpu = runInstruction(cpu);
      update();
    },
    { signal: events.signal },
  );
  get("lang-format").addEventListener(
    "change",
    () => {
      hex = get<HTMLSelectElement>("lang-format").value === "hex";
      update();
    },
    { signal: events.signal },
  );
  update();
  return () => {
    events.abort();
    layout.dispose();
  };
}
