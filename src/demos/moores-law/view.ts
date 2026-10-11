import p5 from "p5";
import { chips, sources, corrections } from "./data";
import {
  modelCount,
  axisPosition,
  axisMaximum,
  formatCount,
  periods,
  START_YEAR,
  END_YEAR,
  type AxisScale,
} from "./model";

export function mountMoore(root: HTMLElement): () => void {
  root.innerHTML = `<a class="back" href="#/sessions/03">← 第3回のデモ一覧</a>
  <div class="page-heading"><p class="eyebrow">DEMO 05 / コンピュータの進化</p><h1>ムーアの法則</h1><p class="lead">「倍になる」を繰り返すと、どれくらい増える？</p></div>
  <p class="goal"><strong>学習目標</strong>　指数的な増加と対数軸の意味を説明し、トランジスタ数と処理性能を区別できる。</p>
  <section class="lab moore-lab" aria-label="ムーアの法則の実験"><div class="lab-bar"><span>代表データと倍増モデルを比較</span><button id="moore-fullscreen">全画面表示</button></div>
  <div id="moore-canvas" role="img" aria-label="横軸は1971〜2050年、縦軸はトランジスタ数。黒丸は代表データ、線は教育用の倍増モデルです。数値は下の表でも確認できます。"></div>
  <p class="moore-legend">● 代表データ　<span>━ 24か月</span>　<span>┄ 18か月</span>　<span>··· 12か月</span>（線はモデル）</p>
  <p class="note">代表データは2023年までです。薄紫の領域は、倍増ペースが続くと仮定した延長です。2050年の実現可能性や製品性能を予測するものではありません。</p>
  <p id="moore-axis-note" class="hint"></p>
  <div class="controls"><div class="spatial-options"><label>縦軸<select id="moore-axis"><option value="log">対数軸（同じ倍率が等間隔）</option><option value="linear">通常軸（同じ差が等間隔）</option></select></label>
  <label>倍増期間<select id="moore-period"><option value="24">24か月</option><option value="18">18か月</option><option value="12">12か月</option></select></label><label class="check"><input id="moore-all" type="checkbox">3つのモデルを同時に表示</label></div>
  <label class="slider" for="moore-year"><span>表示する年<output id="moore-year-value" for="moore-year" aria-live="off">2050 年</output></span><input id="moore-year" type="range" min="1971" max="2050" step="1" value="2050"></label>
  <div class="transport"><button class="primary" id="moore-play">開始</button><button id="moore-reset">リセット</button><label class="check"><input id="moore-reduced" type="checkbox">動きを減らす</label></div><p class="status" id="moore-status" role="status">停止中。軸を切り替えて同じデータの見え方を比べましょう。</p></div>
  <div class="moore-models"><h2 id="moore-model-title">2050年のモデル値</h2><div class="moore-values">${periods.map((m) => `<div>${m}か月で倍増<strong id="moore-value-${m}"></strong></div>`).join("")}</div><p class="hint">すべて1971年・2,300個から計算。実際のチップの予測値ではありません。e+27は「×10の27乗」を表します。</p></div></section>
  <p class="goal"><strong>CPUとSoCが混在する概観です。</strong>厳密な同条件比較ではありません。M2 UltraはCPU・GPUなどを含む2ダイ構成のSoCです。<strong>トランジスタ数が2倍でも、処理性能が2倍とは限りません。</strong></p>
  <section class="moore-data"><h2>グラフの代表データと出典</h2><div class="moore-table-wrap"><table><caption>メーカー資料による代表値（グラフ上の丸数字に対応）</caption><thead><tr><th scope="col">番号・製品</th><th scope="col">年</th><th scope="col">トランジスタ数</th><th scope="col">分類・出典</th></tr></thead><tbody>${chips.map((chip, i) => `<tr><th scope="row">${i + 1}. ${chip.name}</th><td>${chip.year}</td><td>約${formatCount(chip.count)}</td><td>${chip.kind} · <a href="${sources[chip.source].url}" target="_blank" rel="noopener noreferrer">${chip.source === "intel" ? "Intel" : "Apple"}の資料</a></td></tr>`).join("")}</tbody></table></div><details><summary>仕様書の値との違い</summary><p>${corrections}</p></details></section>
  <div class="learning-grid"><section><p class="eyebrow">OBSERVE</p><h2>予想 → 操作 → 説明</h2>
  <details><summary>① 対数軸では、なぜモデルが直線になる？</summary><p>24か月モデルを通常軸と対数軸で比較します。通常軸では後半ほど増加が急に見えます。対数軸では同じ倍率を等しい間隔で表すので、一定期間で倍になるモデルは直線になります。データ自体は変わっていません。</p></details>
  <details><summary>② 12・18・24か月の違いは、長く続くと？</summary><p>3モデルの同時表示をONにし、年を動かします。最初は同じでも、倍増回数の差が積み重なって大きく離れます。12か月を2050年まで延ばした線は、実際の成長がずっと同じだったという主張ではありません。</p></details>
  <details><summary>③ トランジスタ数だけで「速さ」を比べられる？</summary><p>Core i7とM2 Ultraの分類を見ましょう。CPUの構成、GPU、キャッシュ、消費電力、実行する処理などが異なります。トランジスタ数だけで性能を順位付けすることはできません。</p></details></section>
  <section><p class="eyebrow">UNDERSTAND</p><h2>3つの「倍増期間」</h2><p><strong>1965年：</strong>Mooreは集積回路の部品数について、約1年で倍増する傾向を述べました。<strong>1975年：</strong>その後のペースを約2年で倍増へ見直しました。自然界の普遍的な法則ではなく、技術の進歩に関する観察・見通しです。<a href="${sources.history.url}" target="_blank" rel="noopener noreferrer">Intelの歴史解説</a></p><p><strong>18か月：</strong>広く使われる表現ですが、1965年の約1年や1975年の約2年と同じ記述ではありません。性能の向上に関する話とも区別しましょう。この教材では比較用モデルとして扱います。<a href="${sources.speech.url}" target="_blank" rel="noopener noreferrer">Mooreの1997年講演（性能についての18〜24か月の言及）</a></p>
  <details><summary>数式とモデルの条件を見る</summary><p>N(y) = 2300 × 2^((y − 1971) × 12 / d)。yは年、dは倍増期間（月）です。3本とも比較しやすい同じ起点を使っており、代表データに当てはめた回帰曲線ではありません。</p><p>横軸は年で等間隔。通常軸の下端は0、対数軸の下端は1,000です。縦軸の上限は選んだモデルの2050年の値と全代表データから決め、年スライダーでは変更しません。モデルを変えると上限も変わるので目盛りを確認しましょう。</p><p>再生は1秒に約4年進み、2050年で停止します。代表点は発売年に表示されます。下の表は全期間の値をいつでも確認できます。</p></details></section></div>`;
  const find = <T extends HTMLElement>(id: string): T => {
    const el = root.querySelector<T>(`#${id}`);
    if (!el) throw new Error(id);
    return el;
  };
  const host = find<HTMLDivElement>("moore-canvas"),
    axis = find<HTMLSelectElement>("moore-axis"),
    period = find<HTMLSelectElement>("moore-period");
  const all = find<HTMLInputElement>("moore-all"),
    year = find<HTMLInputElement>("moore-year"),
    reduced = find<HTMLInputElement>("moore-reduced"),
    play = find<HTMLButtonElement>("moore-play"),
    status = find("moore-status");
  const events = new AbortController(),
    media = matchMedia("(prefers-reduced-motion: reduce)");
  reduced.checked = media.matches;
  let time = END_YEAR,
    running = false,
    ready = false,
    disposed = false,
    previous: number | undefined;
  const selected = () => (all.checked ? [...periods] : [Number(period.value)]);
  const update = () => {
    const y = Math.floor(time);
    year.value = String(y);
    find<HTMLOutputElement>("moore-year-value").value = `${y} 年`;
    find("moore-model-title").textContent = `${y}年のモデル値`;
    for (const m of periods)
      find(`moore-value-${m}`).textContent = formatCount(modelCount(y, m));
    period.disabled = all.checked;
    play.disabled = reduced.checked;
    play.textContent = running ? "停止" : "開始";
    find("moore-axis-note").textContent =
      axis.value === "log"
        ? "対数軸：10^3は1,000個。縦の間隔は倍率を表します。"
        : "通常軸：縦の間隔は個数の差。大きなモデルを含めると初期の点が下端に集まります。";
  };
  const sketch = new p5((p) => {
    p.setup = () => {
      p.createCanvas(host.clientWidth, 380).parent(host);
      p.pixelDensity(1);
      p.frameRate(20);
      p.noLoop();
      ready = true;
    };
    p.draw = () => {
      if (disposed) return;
      const now = performance.now();
      if (running && !document.hidden && !reduced.checked) {
        if (previous !== undefined)
          time = Math.min(END_YEAR, time + ((now - previous) / 1000) * 4);
        previous = now;
        if (time === END_YEAR) {
          running = false;
          p.noLoop();
          status.textContent = "2050年まで表示しました。";
        }
      }
      const scale = axis.value as AxisScale,
        models = selected();
      const linearMaximum = axisMaximum(models);
      const maximum =
        scale === "log"
          ? 10 ** Math.ceil(Math.log10(linearMaximum))
          : linearMaximum;
      const left = 65,
        right = p.width - 28,
        top = 35,
        bottom = 320;
      const x = (y: number) =>
        left + ((y - START_YEAR) / (END_YEAR - START_YEAR)) * (right - left);
      const y = (v: number) =>
        bottom - axisPosition(v, scale, maximum) * (bottom - top);
      p.background("#FFFFFF");
      p.noStroke();
      p.fill("#F2ECF7");
      p.rect(x(2023), top, right - x(2023), bottom - top);
      p.stroke("#8060A8");
      p.line(x(2023), top, x(2023), bottom);
      p.noStroke();
      p.fill("#4B286D");
      p.textSize(11);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("仮定の延長", (x(2023) + right) / 2, top + 12);
      p.textSize(11);
      p.textAlign(p.LEFT, p.CENTER);
      p.noStroke();
      p.fill("#615b6c");
      p.text(
        `トランジスタ数（${scale === "log" ? "対数軸" : "通常軸"}）`,
        left,
        15,
      );
      const ticks =
        scale === "log"
          ? Array.from(
              { length: Math.floor(Math.log10(maximum)) - 2 },
              (_, i) => 10 ** (i + 3),
            ).filter((_, i, values) => i % Math.ceil(values.length / 12) === 0)
          : Array.from({ length: 5 }, (_, i) => (maximum * i) / 4);
      for (const tick of ticks) {
        const yy = y(tick);
        p.stroke("#DDD4E6");
        p.line(left, yy, right, yy);
        p.noStroke();
        p.fill("#615b6c");
        p.textAlign(p.RIGHT, p.CENTER);
        p.text(
          scale === "log"
            ? `10^${Math.round(Math.log10(tick))}`
            : tick === 0
              ? "0"
              : tick.toExponential(1),
          left - 8,
          yy,
        );
      }
      p.stroke("#8060A8");
      p.line(left, top, left, bottom);
      p.line(left, bottom, right, bottom);
      const years =
        p.width < 550
          ? [1971, 2000, 2023, 2050]
          : [1971, 1990, 2000, 2010, 2023, 2040, 2050];
      for (const tick of years) {
        p.noStroke();
        p.fill("#615b6c");
        p.textAlign(p.CENTER, p.TOP);
        p.text(String(tick), x(tick), bottom + 10);
      }
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      for (const m of models) {
        p.noFill();
        p.stroke(m === 24 ? "#4B286D" : m === 18 ? "#00695c" : "#9c4b0c");
        p.strokeWeight(2);
        ctx.setLineDash(m === 24 ? [] : m === 18 ? [8, 4] : [2, 4]);
        p.beginShape();
        for (let yy = START_YEAR; yy <= Math.floor(time); yy++)
          p.vertex(x(yy), y(modelCount(yy, m)));
        p.endShape();
      }
      ctx.setLineDash([]);
      p.stroke("#b4a9bf");
      p.strokeWeight(1);
      p.line(x(Math.floor(time)), top, x(Math.floor(time)), bottom);
      chips.forEach((chip, i) => {
        if (chip.year > Math.floor(time)) return;
        p.fill("#22212A");
        p.stroke("#FFFFFF");
        p.strokeWeight(1);
        p.circle(x(chip.year), y(chip.count), 9);
        p.noStroke();
        p.fill("#22212A");
        p.textAlign(p.CENTER, p.BOTTOM);
        p.text(String(i + 1), x(chip.year), y(chip.count) - 7);
      });
      p.noStroke();
      p.fill("#615b6c");
      p.textAlign(p.CENTER, p.CENTER);
      p.text("年（1971〜2050）", p.width / 2, 362);
      update();
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
  for (const el of [axis, period, all]) listen(el, "change", sync);
  listen(year, "input", () => {
    running = false;
    time = Number(year.value);
    status.textContent = "選んだ年まで表示しています。";
    sync();
  });
  listen(play, "click", () => {
    running = !running;
    if (running && time >= END_YEAR) time = START_YEAR;
    status.textContent = running ? "年を進めています。" : "停止中";
    sync();
  });
  listen(find("moore-reset"), "click", () => {
    running = false;
    time = END_YEAR;
    axis.value = "log";
    period.value = "24";
    all.checked = false;
    status.textContent = "初期設定に戻しました。";
    sync();
  });
  const reduce = () => {
    if (reduced.checked) running = false;
    status.textContent = reduced.checked
      ? "動きを減らす設定：年スライダーで比較できます。"
      : "停止中";
    sync();
  };
  listen(reduced, "change", reduce);
  listen(media, "change", () => {
    reduced.checked = media.matches;
    reduce();
  });
  listen(document, "visibilitychange", sync);
  const lab = root.querySelector<HTMLElement>(".moore-lab")!;
  listen(find("moore-fullscreen"), "click", () => {
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
    find("moore-fullscreen").textContent = document.fullscreenElement
      ? "全画面を終了"
      : "全画面表示";
  });
  const observer = new ResizeObserver(() => {
    if (ready && !disposed) sketch.resizeCanvas(host.clientWidth, 380);
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
