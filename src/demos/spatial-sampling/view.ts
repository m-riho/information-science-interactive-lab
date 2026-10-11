import p5 from "p5";
import {
  makeReference,
  lowPass,
  samplePattern,
  type Pattern,
  type SamplingOptions,
} from "./model";

const SOURCE_SIZE = 512;
const initial: SamplingOptions = {
  pattern: "stripes",
  frequency: 30,
  phase: 0,
  resolution: 32,
};

export function mountSpatial(root: HTMLElement): () => void {
  root.innerHTML = `<a class="back" href="#/sessions/03">← 第3回のデモ一覧</a>
    <div class="page-heading"><p class="eyebrow">DEMO 02 / 空間の標本化</p><h1>空間サンプリングとモアレ</h1><p class="lead">細かな縞を読み取ったら、大きな縞が現れた。</p></div>
    <p class="goal"><strong>学習目標</strong>　画像を粗い格子で読み取ると模様が変わる理由と、ローパス・表示補間の違いを説明できる。</p>
    <section class="lab spatial-lab" aria-label="空間サンプリングの実験">
      <div class="lab-bar"><span>模様を比べてみよう</span><button id="spatial-fullscreen">全画面表示</button></div>
      <div class="visual-labels"><div>基準画像 <small>解析式から512 × 512で作成</small></div><div>標本化した画像 <small id="sample-label">32 × 32点 → 拡大表示</small></div></div>
      <div id="spatial-canvas" role="img" aria-label="左は細かな基準画像、右は格子の中心で読み取って拡大した画像。"></div>
      <p class="spatial-pipeline" id="pipeline">元の模様 → 点で読み取る → 最近傍で拡大</p>
      <div class="controls"><div class="presets"><span>まずは試す</span><button data-spatial-preset="moire">モアレを見る</button><button data-spatial-preset="jaggy">ジャギーを見る</button><button data-spatial-preset="rings">同心円を見る</button></div>
      <div class="spatial-options"><label>基準の模様<select id="pattern"><option value="stripes">縞</option><option value="grid">格子</option><option value="diagonal">斜線</option><option value="rings">同心円</option></select></label>
      <label>表示時の補間<select id="interpolation"><option value="nearest">最近傍（四角い点をそのまま）</option><option value="linear">線形（点の間をなめらかに）</option></select></label>
      <label class="check"><input id="lowpass" type="checkbox">標本化前ローパス</label></div>
      <div class="sliders">
      ${slider("frequency", "模様の細かさ", 2, 64, 1, 30, "周期 / 単位長さ")}
      ${slider("resolution", "格子解像度", 16, 256, 1, 32, "点 / 辺")}
      ${slider("phase", "位相（模様のずれ）", 0, 1, 0.01, 0, "周期")}</div>
      <div class="transport"><button class="primary" id="spatial-play">開始</button><button id="spatial-reset">リセット</button><label class="check"><input type="checkbox" id="spatial-reduced">動きを減らす</label></div>
      <p id="spatial-status" class="status" role="status">停止中。まずはローパスをONにして、右の模様を比べてください。</p></div>
    </section>
    <p class="hint">操作：開始すると位相がゆっくり変わります。スライダーは矢印キーでも調整できます。模様の細かさは縞の法線方向（同心円では半径方向）の1画像幅あたりの周期数です。</p>
    <p class="goal"><strong>2つの操作は別ものです</strong><br>ローパス：<strong>読み取る前</strong>に細かすぎる変化を弱める。<br>表示補間：<strong>読み取った後</strong>に点と点の間を埋める。失われた元の模様を取り戻すことはできません。</p>
    <div class="learning-grid"><section><p class="eyebrow">OBSERVE</p><h2>予想 → 操作 → 説明</h2>
    <details><summary>① 30周期の縞を32点で読むと、どうなる？</summary><p>「モアレを見る」で左右を比較しましょう。細かい縞が、右では2周期の大きな縞に見えます。読み取り格子と模様の間隔が干渉して、別の模様が現れます。解像度を128まで上げると違いは小さくなります。</p></details>
    <details><summary>② 線形補間だけで、モアレは消える？</summary><p>モアレのプリセットで「線形」に変更。四角い境界はなめらかになりますが、大きな縞は残ります。次にローパスをONにすると、標本化の前に細かな変化が弱められ、誤った縞も抑えられます。</p></details>
    <details><summary>③ ローパスを強く効かせると、何を失う？</summary><p>「同心円を見る」でローパスを切り替えます。モアレは減りますが、細かな模様のコントラストも減り、ぼけます。誤った模様を抑えることと、細部を残すことの両方を観察しましょう。</p></details></section>
    <section><p class="eyebrow">UNDERSTAND</p><h2>なぜそうなる？</h2><p><strong>モアレ</strong>は、元にはない大きな縞やうねりです。空間の標本化で細かな変化を捉えきれず、別の粗い模様に見えることがあります。</p><p><strong>ジャギー</strong>は、斜めの境界などが階段状に見えること。<strong>ぼけ</strong>は、明暗の変化や細部が弱まることです。この3つを区別しましょう。</p>
    <details><summary>数式とローパスのモデルを見る</summary><p>縞の明るさは I(x) = 0.5 + 0.5 cos(2π(fx + φ))。xは画像幅を1とした位置、fは細かさ、φは位相です。格子では縦横の余弦波を平均し、斜線では (x+y)/√2、同心円では中心からの距離を使います。</p><p>N × N格子の各セル中心 (i+0.5)/N で値を読みます。縞を正しく表す目安は、1周期につき2点より多く取ることです。ちょうど2点では位相により曖昧になります。</p><p>ローパスは512 × 512の内部画像に縦横の移動平均を3回適用するガウス状の近似です。平均化の半径は round(0.6 × 512 / N)（最小1）。画像端は端の値を延長します。完全に折り返しを除く理想フィルタではありません。</p><p>表示時の最近傍・線形補間は、同じ標本値をCanvasで拡大する方法だけを切り替えます。</p></details></section></div>
    <p class="note">左も実際の画面上では有限の画素で表示されます。小さい画面や非常に細かい模様では、表示自体にモアレが生じることがあります。全画面や細かさの調整で比較してください。非表示タブでは動きを停止します。</p>`;

  const find = <T extends HTMLElement>(id: string): T => {
    const element = root.querySelector<T>(`#${id}`);
    if (!element) throw new Error(`要素が見つかりません: ${id}`);
    return element;
  };
  const host = find<HTMLDivElement>("spatial-canvas");
  const pattern = find<HTMLSelectElement>("pattern");
  const interpolation = find<HTMLSelectElement>("interpolation");
  const lowpass = find<HTMLInputElement>("lowpass");
  const frequency = find<HTMLInputElement>("frequency");
  const resolution = find<HTMLInputElement>("resolution");
  const phase = find<HTMLInputElement>("phase");
  const reduced = find<HTMLInputElement>("spatial-reduced");
  const play = find<HTMLButtonElement>("spatial-play");
  const status = find("spatial-status");
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  const events = new AbortController();
  const options = { ...initial };
  reduced.checked = media.matches;
  let running = false,
    disposed = false,
    ready = false,
    dirty = true;
  let previous: number | undefined;
  let referenceImage: p5.Image | undefined;
  let sampledImage: p5.Image | undefined;

  const update = () => {
    for (const input of [frequency, resolution, phase])
      find<HTMLOutputElement>(`${input.id}-value`).value =
        `${input.value} ${input.dataset.unit ?? ""}`;
    find("sample-label").textContent =
      `${options.resolution} × ${options.resolution}点 → 拡大表示`;
    find("pipeline").textContent =
      `元の模様 → ${lowpass.checked ? "ローパスで細かい変化を弱める → " : ""}${options.resolution} × ${options.resolution}点で読み取る → ${interpolation.value === "nearest" ? "最近傍" : "線形"}で拡大`;
    play.textContent = running ? "停止" : "開始";
    play.disabled = reduced.checked;
  };
  const dimensions = () => {
    const width = host.clientWidth;
    return {
      width,
      size: Math.max(1, Math.min(SOURCE_SIZE, Math.floor((width - 36) / 2))),
    };
  };
  const sketch = new p5((p) => {
    const toImage = (
      values: Float32Array,
      size: number,
      image?: p5.Image,
    ): p5.Image => {
      const target = image?.width === size ? image : p.createImage(size, size);
      target.loadPixels();
      for (let i = 0; i < values.length; i++) {
        const value = Math.round(values[i]! * 255);
        target.pixels[i * 4] = value;
        target.pixels[i * 4 + 1] = value;
        target.pixels[i * 4 + 2] = value;
        target.pixels[i * 4 + 3] = 255;
      }
      target.updatePixels();
      return target;
    };
    p.setup = () => {
      const { width, size } = dimensions();
      p.createCanvas(width, size + 24).parent(host);
      p.pixelDensity(1);
      p.frameRate(12);
      p.noLoop();
      ready = true;
    };
    p.draw = () => {
      if (disposed) return;
      const now = performance.now();
      if (running && !document.hidden && !reduced.checked) {
        if (previous !== undefined) {
          options.phase =
            (options.phase + ((now - previous) / 1000) * 0.12) % 1;
          phase.value = options.phase.toFixed(2);
          dirty = true;
        }
        previous = now;
      }
      if (dirty) {
        const source = makeReference(options, SOURCE_SIZE);
        const filtered = lowpass.checked
          ? lowPass(source, SOURCE_SIZE, options.resolution)
          : undefined;
        referenceImage = toImage(source, SOURCE_SIZE, referenceImage);
        sampledImage = toImage(
          samplePattern(options, filtered, SOURCE_SIZE),
          options.resolution,
          sampledImage,
        );
        dirty = false;
      }
      const { width, size } = dimensions();
      p.background("#FFFFFF");
      const context = p.drawingContext as CanvasRenderingContext2D;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      if (referenceImage)
        p.image(referenceImage, width / 4 - size / 2, 12, size, size);
      context.imageSmoothingEnabled = interpolation.value === "linear";
      context.imageSmoothingQuality = "low";
      if (sampledImage)
        p.image(sampledImage, (width * 3) / 4 - size / 2, 12, size, size);
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
  const listen = (element: EventTarget, event: string, action: () => void) =>
    element.addEventListener(event, action, { signal: events.signal });
  const readControls = () => {
    options.pattern = pattern.value as Pattern;
    options.frequency = Number(frequency.value);
    options.resolution = Number(resolution.value);
    options.phase = Number(phase.value);
    dirty = true;
    sync();
  };
  for (const input of [frequency, resolution, phase])
    listen(input, "input", readControls);
  for (const control of [pattern, lowpass])
    listen(control, "change", readControls);
  listen(interpolation, "change", sync);
  listen(play, "click", () => {
    running = !running;
    status.textContent = running
      ? "位相をゆっくり動かしています。"
      : "停止中。設定を変えて比較できます。";
    sync();
  });
  const setOptions = (next: SamplingOptions) => {
    Object.assign(options, next);
    pattern.value = next.pattern;
    frequency.value = String(next.frequency);
    resolution.value = String(next.resolution);
    phase.value = String(next.phase);
    lowpass.checked = false;
    interpolation.value = "nearest";
    running = false;
    dirty = true;
    sync();
  };
  listen(find("spatial-reset"), "click", () => {
    setOptions(initial);
    status.textContent = "初期設定に戻しました。";
  });
  for (const button of root.querySelectorAll<HTMLButtonElement>(
    "[data-spatial-preset]",
  ))
    listen(button, "click", () => {
      const name = button.dataset.spatialPreset;
      setOptions(
        name === "jaggy"
          ? { pattern: "diagonal", frequency: 4, phase: 0, resolution: 16 }
          : name === "rings"
            ? { pattern: "rings", frequency: 30, phase: 0, resolution: 32 }
            : initial,
      );
      status.textContent = `「${button.textContent}」の設定にしました。`;
    });
  const applyReduced = () => {
    if (reduced.checked) running = false;
    status.textContent = reduced.checked
      ? "動きを減らす設定：位相スライダーで観察できます。"
      : "停止中。開始すると位相が変わります。";
    sync();
  };
  listen(reduced, "change", applyReduced);
  listen(media, "change", () => {
    reduced.checked = media.matches;
    applyReduced();
  });
  listen(document, "visibilitychange", sync);
  const lab = root.querySelector<HTMLElement>(".spatial-lab")!;
  listen(find("spatial-fullscreen"), "click", () => {
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
    find("spatial-fullscreen").textContent = document.fullscreenElement
      ? "全画面を終了"
      : "全画面表示";
  });
  const observer = new ResizeObserver(() => {
    if (ready && !disposed) {
      const { width, size } = dimensions();
      sketch.resizeCanvas(width, size + 24);
    }
  });
  observer.observe(host);
  update();
  return () => {
    disposed = true;
    events.abort();
    observer.disconnect();
    sketch.remove();
    referenceImage = undefined;
    sampledImage = undefined;
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
  return `<label class="slider" for="${id}"><span>${label}<output id="${id}-value" for="${id}" aria-live="off">${value} ${unit}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-unit="${unit}"></label>`;
}
