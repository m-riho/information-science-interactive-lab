import { mountDemoLayout } from "../../components/demoLayout";
import { session04Demos } from "../../sessions/session04";
import {
  initialCPU,
  stepCPU,
  runInstruction,
  additionProgram,
  countdownProgram,
  address,
  instructionText,
  describe,
  MAX_INSTRUCTIONS,
  type Memory,
} from "./model";
const AUTO_INTERVAL_MS = 800;
export function mountCPU(root: HTMLElement, branch = false): () => void {
  let sample = "countdown",
    state = initialCPU(branch ? countdownProgram(3) : additionProgram()),
    timer: ReturnType<typeof setInterval> | undefined;
  const events = new AbortController();
  const program = (): Memory =>
    !branch
      ? additionProgram()
      : sample === "loop"
        ? { 0: { op: "JMP", addr: 0 } }
        : countdownProgram(sample === "zero" ? 0 : 3);
  const clear = () => {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
  };
  const layout = mountDemoLayout(root, session04Demos[branch ? 3 : 2], {
    reset: () => {
      clear();
      state = initialCPU(program());
      layout.controls.setCompleted(false);
      update();
    },
    step: () => advance(branch),
    start: () => {
      timer = setInterval(() => advance(branch), AUTO_INTERVAL_MS);
      update();
    },
    stop: () => {
      clear();
      update();
    },
  });
  layout.instructions.textContent = branch
    ? "1命令ずつ進め、PCがどの番地へ移るか確認しましょう。Zero flagはACCが0のとき1です。自動実行は100命令までで停止します。"
    : "1ステップでFetch → Decode → Executeを進めます。「1命令」は実行中の命令を最後まで進めます。最後に12番地が13になることを確認しましょう。";
  layout.body.innerHTML = `${branch ? '<label>プログラム例<select id="cpu-program"><option value="countdown">3から0へカウントダウン</option><option value="zero">最初から0：すぐに条件成立</option><option value="loop">無限ジャンプ：安全停止を確認</option></select></label>' : '<button id="cpu-instruction">1命令進める</button>'}<div class="cpu-phases" aria-label="命令実行の段階"><span data-phase="fetch">1 Fetch<br>取り出す</span><span data-phase="decode">2 Decode<br>解読する</span><span data-phase="execute">3 Execute<br>実行する</span></div><p id="cpu-progress"></p><div class="cpu-grid"><section><h2>メモリ</h2><p class="hint">PC行は次に取り出す命令の位置。参照・書込行は直前のアクセス先です。</p><table class="storage-table"><thead><tr><th>番地</th><th>内容</th><th>状態</th></tr></thead><tbody id="cpu-memory"></tbody></table></section><section><h2>CPU・レジスタ</h2><dl class="cpu-registers"><dt>PC（次の命令位置）</dt><dd id="cpu-pc"></dd><dt>IR（取り込んだ命令）</dt><dd id="cpu-ir"></dd><dt>ACC（計算用レジスタ）</dt><dd id="cpu-acc"></dd><dt>Zero flag</dt><dd id="cpu-zero"></dd></dl><p id="cpu-explanation"></p><p id="cpu-result" class="storage-result" role="status"></p></section></div><details ${branch ? "open" : ""}><summary>実行履歴：PCの移動を見る</summary><div class="storage-history" tabindex="0" role="region" aria-label="表。狭い画面では横にスクロールできます。"><table class="storage-table"><thead><tr><th>回数</th><th>PCの移動</th><th>命令</th><th>ACC</th><th>Zero</th></tr></thead><tbody id="cpu-history"></tbody></table></div></details><details><summary>${branch ? "予想：Zero flagが0ならJZはどう動く？" : "予想：Fetchだけで足し算は終わる？"}</summary><p>${branch ? "JZは条件不成立なら次の番地へ進みます。SUBでACCが0になった後は、JZで06番地のHALTへ移ります。" : "Fetchは命令をIRへ取り込む段階です。Decodeで意味を解釈し、Executeで初めてACCやデータメモリを更新します。"}</p></details><details><summary>${branch ? "予想：JMPを繰り返すと止まる？" : "予想：ACCが13になれば12番地も13？"}</summary><p>${branch ? "HALTへ到達しないプログラムは止まりません。この教材では100命令で安全停止します。リセットしない限り続行できません。" : "ACCとメモリは別の記憶場所です。STORE 12を実行するまでは12番地の値は変わりません。"}</p></details><p class="hint">教育用仮想命令セットです。実在のx86/ARMではありません。番地・データは十進数、PCはExecute完了時に更新します。LOAD・ADD・SUBでZero flagを更新し、STORE・JMP・JZは保持します。HALTではPCをその位置に保ちます。命令と数値データを区別し、実CPUのビット幅・パイプライン・実時間は再現しません。</p>`;
  const get = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!;
  if (branch)
    root.querySelector<HTMLElement>('[data-action="step"]')!.textContent =
      "1命令進める";
  const update = () => {
    const labels = { fetch: "Fetch", decode: "Decode", execute: "Execute" };
    root.querySelectorAll<HTMLElement>("[data-phase]").forEach((el) => {
      const active = el.dataset.phase === state.lastPhase;
      el.classList.toggle("current", active);
      if (active) el.setAttribute("aria-current", "step");
      else el.removeAttribute("aria-current");
    });
    get("cpu-progress").textContent =
      `${state.lastPhase ? "直前：" + labels[state.lastPhase] + "完了。" : "初期状態。"} ${state.halted ? "停止中" : "次：" + labels[state.phase]} ／ 完了命令 ${state.count} / ${MAX_INSTRUCTIONS}`;
    get("cpu-memory").innerHTML = Object.entries(state.memory)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(
        ([addr, cell]) =>
          `<tr class="${Number(addr) === state.pc ? "current" : ""}"><td>${address(Number(addr))}</td><td>${typeof cell === "number" ? cell : instructionText(cell)}</td><td>${[Number(addr) === state.pc ? "← PC" : "", Number(addr) === state.touched ? "参照・書込" : ""].filter(Boolean).join(" / ") || "—"}</td></tr>`,
      )
      .join("");
    get("cpu-pc").textContent = address(state.pc);
    get("cpu-ir").textContent = state.ir ? instructionText(state.ir) : "未取得";
    get("cpu-acc").textContent = String(state.acc);
    get("cpu-zero").textContent = state.zero
      ? "1（ACCは0）"
      : "0（ACCは0ではない）";
    get("cpu-explanation").textContent = state.ir
      ? describe(state.ir)
      : "命令をメモリから取り出すのを待っています。";
    get("cpu-result").textContent =
      state.reason === "limit"
        ? "上限に到達：100命令で安全停止"
        : state.reason === "error"
          ? "エラー停止"
          : state.halted
            ? `HALT：実行終了${!branch ? " ／ メモリ[12] = " + state.memory[12] : sample !== "loop" ? " ／ メモリ[10] = " + state.memory[10] : ""}`
            : timer === undefined
              ? "停止中：手動または自動で進められます"
              : "自動実行中";
    get("cpu-history").innerHTML = state.history.length
      ? state.history
          .map(
            (h, n) =>
              `<tr><td>${n + 1}</td><td>${address(h.from)} → ${address(h.to)}</td><td>${h.instruction}</td><td>${h.acc}</td><td>${Number(h.zero)}</td></tr>`,
          )
          .join("")
      : '<tr><td colspan="5">まだ命令は完了していません。</td></tr>';
    layout.status.textContent = state.message;
    const instruction =
      root.querySelector<HTMLButtonElement>("#cpu-instruction");
    if (instruction) instruction.disabled = state.halted || timer !== undefined;
  };
  function advance(whole: boolean) {
    state = whole ? runInstruction(state) : stepCPU(state);
    if (state.halted) {
      clear();
      layout.controls.setRunning(false);
      layout.controls.setCompleted(true);
    }
    update();
  }
  const instruction = root.querySelector("#cpu-instruction");
  instruction?.addEventListener("click", () => advance(true), {
    signal: events.signal,
  });
  root.querySelector<HTMLSelectElement>("#cpu-program")?.addEventListener(
    "change",
    (event) => {
      sample = (event.currentTarget as HTMLSelectElement).value;
      clear();
      layout.controls.setRunning(false);
      layout.controls.setCompleted(false);
      state = initialCPU(program());
      update();
    },
    { signal: events.signal },
  );
  update();
  return () => {
    clear();
    events.abort();
    layout.dispose();
  };
}
