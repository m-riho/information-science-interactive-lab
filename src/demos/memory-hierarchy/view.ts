import p5 from "p5";
import {
  access,
  emptyCache,
  makeSequence,
  BLOCK_SIZE,
  type AccessPattern,
  type AccessResult,
} from "./model";

export function mountMemory(root: HTMLElement): () => void {
  root.innerHTML = `<a class="back" href="#/sessions/03">← 第3回のデモ一覧</a>
  <div class="page-heading"><p class="eyebrow">DEMO 04 / 記憶装置</p><h1>メモリ階層とキャッシュ</h1><p class="lead">よく使うデータを近くに置くと、何が変わる？</p></div>
  <p class="goal"><strong>学習目標</strong>　キャッシュのヒット・ミスと、時間的／空間的局所性の関係を説明できる。</p>
  <section class="lab memory-lab" aria-label="キャッシュの実験"><div class="lab-bar"><span>CPUの読み出し要求を追いかけよう</span><button id="mem-fullscreen">全画面表示</button></div>
  <div id="mem-canvas" role="img" aria-label="CPU・レジスタ・キャッシュ・RAM・SSDの関係。要求はCPUからキャッシュへ、ミス時はRAMへ進みます。"></div>
  <div class="memory-stats" aria-label="完了した要求の統計"><div>ヒット率<strong id="mem-rate">0.0%</strong></div><div>ミス数<strong id="mem-misses">0</strong></div><div>総待ち時間<strong id="mem-wait">0 単位</strong></div><div>完了した要求<strong id="mem-count">0 / 48</strong></div></div>
  <p class="note memory-note"><strong>待ち時間は教育用の仮想値です。</strong>キャッシュ確認に1単位、ミス時はRAM読み出しに追加10単位。実測の時間・性能ではありません。アニメーションの長さも待ち時間の比率を表しません。</p>
  <div class="memory-cache"><h2>キャッシュの中身 <small>表示順：最近使った → 最も長く使っていない（LRU）</small></h2><div id="mem-slots" class="memory-slots"></div><p class="hint">1ブロック = 連続する4個のデータ。B0はアドレス0〜3、B1は4〜7…です。満杯なら末尾のブロックを追い出します。</p></div>
  <div class="controls"><div class="presets"><span>まずは試す</span><button data-mem-preset="repeat">同じ4か所を使う</button><button data-mem-preset="small">容量を2に減らす</button><button data-mem-preset="sequential">近くを順番に使う</button></div>
  <div class="spatial-options"><label>アクセスパターン<select id="mem-pattern"><option value="repeat">繰り返し：0, 4, 8, 12</option><option value="sequential">順次：0〜31を順番に</option><option value="random">ランダム：固定した疑似乱数列</option></select></label></div>
  <div class="sliders">${slider("mem-capacity", "キャッシュ容量", 1, 8, 1, 4, "ブロック")}${slider("mem-speed", "再生速度", 0.5, 4, 0.5, 1, "倍")}</div>
  <div class="transport"><button class="primary" id="mem-play">開始</button><button id="mem-step">1要求進める</button><button id="mem-reset">リセット</button><label class="check"><input id="mem-reduced" type="checkbox">動きを減らす</label></div>
  <p class="status" id="mem-status" role="status">停止中。1要求ずつ進めて、最初の4回と次の4回を比べましょう。</p></div>
  <div class="memory-sequence"><h2>今回の48要求 <small>数字は読み出すアドレス</small></h2><div id="mem-sequence"></div></div></section>
  <p class="hint">操作：容量・パターンの変更はキャッシュと統計を空に戻します。再生速度の変更は途中の状態を保ちます。1要求進めると、処理中の要求があればそれを完了し、停止します。</p>
  <div class="learning-grid"><section><p class="eyebrow">OBSERVE</p><h2>予想 → 操作 → 説明</h2>
  <details><summary>① 同じ4か所を繰り返すと、いつから速くなる？</summary><p>「同じ4か所を使う」を選び、8要求進めます。最初の4回はミス、次の4回はヒットです。最近使った場所をまた使う性質を「時間的局所性」と呼びます。</p></details>
  <details><summary>② 容量を4から2にすると、どうなる？</summary><p>「容量を2に減らす」を選びます。4ブロックを順番に使う間に、次に必要なものが追い出されます。この列では48要求すべてミスです。容量4ならミスは最初の4回だけになります。</p></details>
  <details><summary>③ 初めて読むアドレスなのに、ヒットする？</summary><p>「近くを順番に使う」で0, 1, 2, 3を読みます。0を読んだとき、同じブロックの1〜3も取り込みます。近い場所を続けて使う性質が「空間的局所性」です。</p></details></section>
  <section><p class="eyebrow">UNDERSTAND</p><h2>なぜそうなる？</h2><p><strong>レジスタ</strong>はCPUが計算に使う値を置く、ごく小さな記憶領域です。<strong>キャッシュ</strong>にはRAMの一部をコピーして、再利用しやすくします。</p><p><strong>RAM</strong>は実行中のプログラムやデータを置く場所、<strong>SSD</strong>は電源を切ってもデータを保存する場所です。この実験では、必要なデータはすでにRAMにあります。キャッシュミスのたびにSSDを読むわけではありません。</p>
  <details><summary>LRU方式とモデルの条件を見る</summary><p>LRU（Least Recently Used）は、最も長く使われていないブロックを追い出す方式です。ヒットでもそのブロックを「最近使った」側へ移します。</p><p>このモデルは1段の全相連想キャッシュです。どのブロックも空き位置に置けます。読み出しのみで、書き込み、多段キャッシュ、プリフェッチ、OSのページングは省略します。</p><p>ヒット率 = ヒット数 ÷ 完了要求数 × 100。総待ち時間 = ヒット数 × 1 + ミス数 × 11。要求が0回のときは0%と表示します。キャッシュを使わずRAMだけ読む比較モデルは設けていません。</p><p>順次は0〜31、繰り返しは0, 4, 8, 12。ランダムは再現可能な固定シードの疑似乱数です。いずれも48要求で終了します。容量を変えても同じ列を使うので、公平に比較できます。</p></details></section></div>`;
  const find = <T extends HTMLElement>(id: string): T => {
    const el = root.querySelector<T>(`#${id}`);
    if (!el) throw new Error(id);
    return el;
  };
  const host = find<HTMLDivElement>("mem-canvas"),
    pattern = find<HTMLSelectElement>("mem-pattern");
  const capacity = find<HTMLInputElement>("mem-capacity"),
    speed = find<HTMLInputElement>("mem-speed"),
    reduced = find<HTMLInputElement>("mem-reduced");
  const play = find<HTMLButtonElement>("mem-play"),
    step = find<HTMLButtonElement>("mem-step"),
    status = find("mem-status");
  const events = new AbortController(),
    media = matchMedia("(prefers-reduced-motion: reduce)");
  reduced.checked = media.matches;
  let state = emptyCache(),
    sequence = makeSequence("repeat"),
    index = 0;
  let pending: AccessResult | undefined,
    last: AccessResult | undefined,
    previous: number | undefined;
  let progress = 0,
    running = false,
    ready = false,
    disposed = false;
  const update = () => {
    for (const input of [capacity, speed])
      find<HTMLOutputElement>(`${input.id}-value`).value =
        `${input.value} ${input.dataset.unit ?? ""}`;
    find("mem-rate").textContent =
      `${index === 0 ? "0.0" : ((state.hits / index) * 100).toFixed(1)}% (${state.hits}ヒット)`;
    find("mem-misses").textContent = String(state.misses);
    find("mem-wait").textContent = `${state.wait} 単位`;
    find("mem-count").textContent = `${index} / ${sequence.length}`;
    find("mem-slots").innerHTML = Array.from(
      { length: Number(capacity.value) },
      (_, i) => {
        const block = state.blocks[i];
        return `<div class="memory-slot">${block === undefined ? "空き" : `<strong>B${block}</strong><small>${block * BLOCK_SIZE}〜${block * BLOCK_SIZE + 3}</small>`}</div>`;
      },
    ).join("");
    find("mem-sequence").innerHTML = sequence
      .map(
        (address, i) =>
          `<span class="memory-request ${i < index ? "done" : i === index ? "current" : ""}" ${i === index ? 'aria-current="step"' : ""} title="要求${i + 1}${i < index ? "：完了" : i === index ? "：次の要求" : ""}">${address}</span>`,
      )
      .join("");
    play.textContent =
      index === sequence.length ? "完了" : running ? "停止" : "開始";
    play.disabled = reduced.checked || index === sequence.length;
    step.disabled = index === sequence.length;
  };
  const begin = () => {
    const address = sequence[index];
    if (!pending && address !== undefined) {
      pending = access(state, address, Number(capacity.value));
      progress = 0;
    }
  };
  const complete = () => {
    if (!pending) return;
    state = pending.state;
    last = pending;
    index++;
    status.textContent = `要求${index}：アドレス${last.address}（B${last.block}）は${last.hit ? "ヒット" : "ミス"}。${last.evicted === undefined ? "" : `B${last.evicted}を追い出しました。`}待ち時間 ${last.cost}単位。`;
    pending = undefined;
    progress = 0;
    if (index === sequence.length) {
      running = false;
      status.textContent += "48要求が完了しました。";
    }
    update();
  };
  const sketch = new p5((p) => {
    p.setup = () => {
      p.createCanvas(host.clientWidth, 390).parent(host);
      p.pixelDensity(1);
      p.frameRate(30);
      p.noLoop();
      ready = true;
    };
    p.draw = () => {
      if (disposed) return;
      const now = performance.now();
      if (running && !document.hidden && !reduced.checked) {
        begin();
        if (previous !== undefined)
          progress += ((now - previous) / 1600) * Number(speed.value);
        previous = now;
        if (progress >= 1) {
          complete();
          if (running) begin();
          else p.noLoop();
        }
      }
      p.background("#FFFFFF");
      const w = p.width,
        cpu = { x: w * 0.25, y: 48 },
        reg = { x: w * 0.75, y: 48 },
        cache = { x: w * 0.5, y: 145 },
        ram = { x: w * 0.5, y: 240 },
        ssd = { x: w * 0.5, y: 335 };
      p.stroke("#DDD4E6");
      p.strokeWeight(2);
      p.line(cpu.x, cpu.y, cache.x, cache.y);
      p.line(cpu.x, cpu.y, reg.x, reg.y);
      p.line(cache.x, cache.y, ram.x, ram.y);
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      ctx.setLineDash([5, 5]);
      p.line(ram.x, ram.y, ssd.x, ssd.y);
      ctx.setLineDash([]);
      const box = (
        x: number,
        y: number,
        width: number,
        title: string,
        detail: string,
      ) => {
        p.fill("#F2ECF7");
        p.stroke("#8060A8");
        p.strokeWeight(1);
        p.rect(x - width / 2, y - 28, width, 56, 9);
        p.noStroke();
        p.fill("#4B286D");
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(16);
        p.text(title, x, y - 9);
        p.textSize(11);
        p.fill("#615b6c");
        p.text(detail, x, y + 13);
      };
      box(
        cpu.x,
        cpu.y,
        Math.min(150, w * 0.43),
        "CPU",
        pending ? `要求：アドレス${pending.address}` : "データを要求",
      );
      box(
        reg.x,
        reg.y,
        Math.min(150, w * 0.43),
        "レジスタ",
        last ? `受け取った値：A${last.address}` : "計算に使う値",
      );
      const width = Math.min(290, w - 32);
      box(
        cache.x,
        cache.y,
        width,
        "キャッシュ",
        `容量${capacity.value}ブロック · LRU`,
      );
      box(ram.x, ram.y, width, "RAM", "アドレス0〜31は準備済み");
      box(ssd.x, ssd.y, width, "SSD", "保存先 · 今回の要求では読まない");
      if (pending) {
        const points = pending.hit
          ? [cpu, cache, cpu, reg]
          : [cpu, cache, ram, cache, cpu, reg];
        const position = Math.min(0.999, progress) * (points.length - 1);
        const part = Math.floor(position),
          a = points[part]!,
          b = points[part + 1]!;
        const ratio = position - part;
        p.fill("#a56016");
        p.stroke("#FFFFFF");
        p.strokeWeight(2);
        p.circle(a.x + (b.x - a.x) * ratio, a.y + (b.y - a.y) * ratio, 15);
        p.noStroke();
        p.fill("#4B286D");
        p.textSize(12);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(
          `B${pending.block}を確認 → ${pending.hit ? "ヒット：キャッシュから取得" : "ミス：RAMから取得"}`,
          w / 2,
          385,
        );
      }
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
  const restart = () => {
    running = false;
    state = emptyCache();
    sequence = makeSequence(pattern.value as AccessPattern);
    index = 0;
    pending = undefined;
    last = undefined;
    progress = 0;
    status.textContent = "キャッシュと統計を空に戻しました。";
    sync();
  };
  listen(play, "click", () => {
    running = !running;
    if (running) begin();
    status.textContent = running
      ? "再生中。要求の完了時に統計とキャッシュが更新されます。"
      : "停止中。途中の要求は再開できます。";
    sync();
  });
  listen(step, "click", () => {
    running = false;
    begin();
    complete();
    sync();
  });
  listen(capacity, "input", restart);
  listen(pattern, "change", restart);
  listen(speed, "input", sync);
  listen(find("mem-reset"), "click", () => {
    capacity.value = "4";
    speed.value = "1";
    pattern.value = "repeat";
    restart();
  });
  for (const button of root.querySelectorAll<HTMLButtonElement>(
    "[data-mem-preset]",
  ))
    listen(button, "click", () => {
      const name = button.dataset.memPreset;
      capacity.value = name === "small" ? "2" : "4";
      pattern.value = name === "sequential" ? "sequential" : "repeat";
      restart();
    });
  const reduce = () => {
    if (reduced.checked) running = false;
    status.textContent = reduced.checked
      ? "動きを減らす設定：1要求ずつ進めて比較できます。"
      : "停止中";
    sync();
  };
  listen(reduced, "change", reduce);
  listen(media, "change", () => {
    reduced.checked = media.matches;
    reduce();
  });
  listen(document, "visibilitychange", sync);
  const lab = root.querySelector<HTMLElement>(".memory-lab")!;
  listen(find("mem-fullscreen"), "click", () => {
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
    find("mem-fullscreen").textContent = document.fullscreenElement
      ? "全画面を終了"
      : "全画面表示";
  });
  const observer = new ResizeObserver(() => {
    if (ready && !disposed) sketch.resizeCanvas(host.clientWidth, 390);
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
function slider(
  id: string,
  label: string,
  min: number,
  max: number,
  step: number,
  value: number,
  unit: string,
): string {
  return `<label class="slider" for="${id}"><span>${label}<output id="${id}-value" for="${id}">${value} ${unit}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-unit="${unit}"></label>`;
}
