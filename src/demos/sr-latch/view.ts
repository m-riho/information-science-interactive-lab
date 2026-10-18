import { mountDemoLayout } from "../../components/demoLayout";
import { session04Demos } from "../../sessions/session04";
import { srNext } from "./model";
import type { Bit } from "../logic-gates/model";
export function mountSR(root: HTMLElement): () => void {
  let s: Bit = 0,
    r: Bit = 0,
    q: Bit | null = 0;
  const events = new AbortController();
  const layout = mountDemoLayout(root, session04Demos[0], {
    reset: () => {
      s = 0;
      r = 0;
      q = 0;
      update();
    },
  });
  layout.instructions.textContent =
    "SetはS、ResetはRを0↔1に反転します。もう一方の入力は変えません。0/0からSetを2回押すと、Sが0へ戻ってもQ=1が残ります。両入力1は禁止入力です。";
  layout.body.innerHTML = `<div class="transport"><button id="sr-set" aria-pressed="false">Set（S：0）</button><button id="sr-reset-input" aria-pressed="false">Reset（R：0）</button><button id="sr-hold">入力を0/0に戻す</button></div><div class="transport storage-inputs"><button id="sr-s" aria-pressed="false">S：0</button><button id="sr-r" aria-pressed="false">R：0</button></div><p id="sr-output" class="storage-result"></p><div id="sr-diagram" class="storage-diagram"></div><p class="hint">四角はNORの論理ブロック。Q = NOT(R OR Q̅)、Q̅ = NOT(S OR Q)。交差する線同士は接続せず、出力がもう一方の入力へ戻ります。</p><table class="storage-table"><caption>NOR型SRラッチの動作</caption><thead><tr><th>S</th><th>R</th><th>動作</th></tr></thead><tbody><tr data-sr="00"><td>0</td><td>0</td><td>以前のQを保持</td></tr><tr data-sr="10"><td>1</td><td>0</td><td>Set：Q=1</td></tr><tr data-sr="01"><td>0</td><td>1</td><td>Reset：Q=0</td></tr><tr data-sr="11"><td>1</td><td>1</td><td>禁止入力</td></tr></tbody></table><details><summary>予想：入力が同じ0/0なら、Qもいつも同じ？</summary><p>Setの後なら1、Resetの後なら0です。現在の入力だけで決まる組合せ回路と異なり、順序回路（Sequential Circuit）は以前の状態にも依存します。</p></details><details><summary>予想：S=1・R=1の後、0/0に戻すと？</summary><p>どちらに落ち着くかをこの教材では決めません。不定のまま表示し、S=1・R=0またはS=0・R=1で確定させます。実際のNOR回路では禁止入力中は両出力0になりますが、その解除時の競合・メタステーブル状態は再現しません。</p></details><p class="hint">リセットは教育用の初期状態S=0・R=0・Q=0へ戻します。電源投入直後の実回路が必ずQ=0になる意味ではありません。</p>`;
  const get = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!;
  const update = () => {
    get("sr-set").textContent = `Set（S：${s} → ${1-s}）`;
    get("sr-reset-input").textContent = `Reset（R：${r} → ${1-r}）`;
    get("sr-set").setAttribute("aria-pressed", String(s === 1));
    get("sr-reset-input").setAttribute("aria-pressed", String(r === 1));
    for (const [name, v] of [
      ["s", s],
      ["r", r],
    ] as const) {
      get(`sr-${name}`).textContent = `${name.toUpperCase()}：${v}`;
      get(`sr-${name}`).setAttribute("aria-pressed", String(v === 1));
    }
    const inverse = q === null ? "?" : String(1 - q),
      value = q === null ? "?" : String(q);
    get("sr-output").textContent =
      `Q = ${value}　／　Q̅ = ${inverse}${q === null ? "（不定）" : ""}`;
    root
      .querySelectorAll<HTMLElement>("[data-sr]")
      .forEach((row) =>
        row.classList.toggle("current", row.dataset.sr === `${s}${r}`),
      );
    get("sr-diagram").innerHTML =
      `<svg viewBox="0 0 600 340" role="img" aria-label="NORゲート2個の交差接続。S=${s}、R=${r}、Q=${value}、Q反転=${inverse}"><g fill="none" stroke="#8060a8" stroke-width="3"><path d="M30 65H220 M30 265H220 M350 85H565 M350 245H565 M415 85V120L160 205V225H220 M415 245V210L160 125V105H220"/><rect x="220" y="45" width="130" height="80" rx="10"/><rect x="220" y="205" width="130" height="80" rx="10"/><circle cx="415" cy="85" r="4" fill="#4b286d"/><circle cx="415" cy="245" r="4" fill="#4b286d"/></g><g fill="#32184c" font-size="20"><text x="30" y="48">R=${r}</text><text x="30" y="300">S=${s}</text><text x="260" y="93">NOR</text><text x="260" y="253">NOR</text><text x="460" y="65">Q=${value}</text><text x="460" y="280">Q̅=${inverse}</text><text x="425" y="175">フィードバック</text></g></svg>`;
    layout.status.textContent =
      s === 1 && r === 1
        ? "禁止入力です。この教材ではQ・Q̅を不定（?）として扱います。"
        : q === null
          ? "禁止入力を解除しましたが状態は未確定です。S=1・R=0またはS=0・R=1で確定してください。"
          : s === 0 && r === 0
            ? `入力を元に戻してもQ=${q}が残る＝状態を記憶する。`
            : `${s ? "Set" : "Reset"}によりQ=${q}になりました。入力を0/0に戻して保持を確認しましょう。`;
  };
  const apply = (x: Bit, y: Bit) => {
    s = x;
    r = y;
    q = srNext(q, s, r);
    update();
  };
  const on = (id: string, fn: () => void) =>
    get(id).addEventListener("click", fn, { signal: events.signal });
  on("sr-set", () => apply(s === 0 ? 1 : 0, r));
  on("sr-reset-input", () => apply(s, r === 0 ? 1 : 0));
  on("sr-hold", () => apply(0, 0));
  on("sr-s", () => apply(s === 0 ? 1 : 0, r));
  on("sr-r", () => apply(s, r === 0 ? 1 : 0));
  update();
  return () => {
    events.abort();
    layout.dispose();
  };
}
