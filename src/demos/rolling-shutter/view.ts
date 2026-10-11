import p5 from "p5";
import {
  frameTime,
  renderPropeller,
  rowTime,
  type CameraSettings,
} from "./model";

const SIZE = 192;
const defaults: CameraSettings = {
  mode: "rolling",
  rps: 3,
  readout: 0.06,
  exposure: 0,
  direction: "down",
};
export function mountRolling(root: HTMLElement): () => void {
  root.innerHTML = `<a class="back" href="#/sessions/03">← 第3回のデモ一覧</a>
  <div class="page-heading"><p class="eyebrow">DEMO 03 / カメラの仕組み</p><h1>ローリングシャッター</h1><p class="lead">まっすぐな羽が、写真では曲がるのはなぜ？</p></div>
  <p class="goal"><strong>学習目標</strong>　行ごとの撮影時刻の違いが、1枚の画像を歪ませることを説明できる。</p>
  <section class="lab rolling-lab" aria-label="ローリングシャッターの実験">
  <div class="lab-bar"><span>プロペラを比べよう <small>正の回転 ＝ 時計回り</small></span><button id="rs-fullscreen">全画面表示</button></div>
  <div class="visual-labels"><div>基準のプロペラ <small>現在時刻の姿・露光なし</small></div><div id="rs-caption">撮影結果：Rolling <small>行ごとに時刻をずらして撮影</small></div></div>
  <div id="rs-canvas" role="img" aria-label="左はまっすぐな3枚羽のプロペラ。右は行ごとの時刻と露光時間を反映した撮影結果です。"></div>
  <p id="rs-timing" class="spatial-pipeline" aria-live="off"></p>
  <div class="controls"><div class="presets"><span>まずは試す</span><button data-rs-preset="rolling">歪みを見る</button><button data-rs-preset="global">同時撮影と比較</button><button data-rs-preset="blur">露光ブラーを見る</button></div>
  <div class="spatial-options"><label>撮影方式<select id="rs-mode"><option value="rolling">Rolling（行ごとに撮影）</option><option value="global">Global（全行同時に撮影）</option></select></label><label>走査方向<select id="rs-direction"><option value="down">上 → 下</option><option value="up">下 → 上</option></select></label></div>
  <div class="sliders">${slider("rs-rps", "回転速度", -12, 12, 0.1, 3, "rps")}${slider("rs-fps", "撮影フレームレート", 1, 30, 1, 12, "fps")}${slider("rs-readout", "1フレームの読み出し時間", 0, 80, 1, 60, "ms")}${slider("rs-exposure", "露光時間", 0, 30, 1, 0, "ms")}</div>
  <div class="transport"><button class="primary" id="rs-play">開始</button><button id="rs-step">1コマ進める</button><button id="rs-reset">リセット</button><label class="check"><input id="rs-reduced" type="checkbox">動きを減らす</label></div>
  <p class="status" id="rs-status" role="status">停止中でも歪みを比較できます。撮影方式や走査方向を変えてみましょう。</p></div></section>
  <p class="hint">操作：スライダーは矢印キーでも調整できます。撮影方式・走査方向の変更は時刻を保ち、それ以外の設定変更は時刻を0に戻します。Globalでは読み出し時間・走査方向は使いません。</p>
  <p class="goal"><strong>2つの現象を区別しよう</strong><br><strong>フレーム間のエイリアシング</strong>：撮影間隔のため、回転が遅く・逆向きに見える。<br><strong>1フレーム内のローリング歪み</strong>：行ごとに撮影時刻が異なり、羽の形が曲がる。停止画像でも観察できます。</p>
  <div class="learning-grid"><section><p class="eyebrow">OBSERVE</p><h2>予想 → 操作 → 説明</h2>
  <details><summary>① 全行を同時に撮ったら、羽は曲がる？</summary><p>「歪みを見る」と「同時撮影と比較」を切り替えましょう。Globalでは同じ時刻のまっすぐな羽、Rollingでは別々の時刻の行をつないだ曲がった羽が写ります。</p></details>
  <details><summary>② 読み出し時間を0にすると、どうなる？</summary><p>Rollingのまま読み出し時間を0にします。行ごとの時刻差がなくなり、Globalと同じ結果になります。時間を増やし、走査方向を反転すると、歪み方も変わります。</p></details>
  <details><summary>③ fpsを上げれば、羽の歪みも消える？</summary><p>読み出し時間は固定してfpsだけ変更します。fpsは次のフレームまでの間隔を変えますが、同じ開始時刻の1枚の中にある行ごとの時刻差は変えません。歪みを減らすには読み出し時間を短くします。</p></details></section>
  <section><p class="eyebrow">UNDERSTAND</p><h2>なぜそうなる？</h2><p>ローリングシャッターは、画像の行を順番に撮影します。プロペラが回る間に読み取り位置が移るので、1枚の中に異なる時刻の姿が混ざります。</p><p><strong>露光時間</strong>は各行が光を取り込む長さです。長いと動きが平均されてぼけます。これは行ごとの時刻差による歪みとは別で、Globalでも起こります。</p>
  <details><summary>数式とモデルの条件を見る</summary><p>上から走査するとき、行の露光開始は t_row = t_frame + (row / height) × readoutTime。下からは row を height−1−row に置き換えます。Globalでは全行が t_frame です。</p><p>各行の露光開始から露光終了までの9つの中点で明るさを平均し、ブラーを近似します。露光0では瞬間の姿です。高速回転・長い露光では離散的な残像が見える場合があります。</p><p>右は t_frame = floor(t × fps) / fps を基準とする完成画像を先に計算して表示します。撮影完了までの待ち時間は再現しません。読み出しと露光がフレーム間隔を超える設定も許す教育用モデルです。</p><p>3枚羽は1/3回転で同じ姿に戻るため、円盤デモの1回転周期のマークとはエイリアシングの条件が違います。ここでは見かけの回転数を表示しません。</p></details></section></div>
  <p class="note">基準画像も実際の画面更新頻度に制限されます。描画は最大24fps、計算画像は192 × 192。非表示タブでは時間と描画を止めます。全画面表示でも計算解像度は変わりません。</p>`;
  const find = <T extends HTMLElement>(id: string): T => {
    const element = root.querySelector<T>(`#${id}`);
    if (!element) throw new Error(id);
    return element;
  };
  const host = find<HTMLDivElement>("rs-canvas");
  const mode = find<HTMLSelectElement>("rs-mode"),
    direction = find<HTMLSelectElement>("rs-direction");
  const rps = find<HTMLInputElement>("rs-rps"),
    fps = find<HTMLInputElement>("rs-fps"),
    readout = find<HTMLInputElement>("rs-readout"),
    exposure = find<HTMLInputElement>("rs-exposure");
  const reduced = find<HTMLInputElement>("rs-reduced"),
    play = find<HTMLButtonElement>("rs-play"),
    status = find("rs-status");
  const settings = { ...defaults };
  const events = new AbortController();
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  reduced.checked = media.matches;
  let time = 0,
    running = false,
    ready = false,
    disposed = false,
    dirty = true;
  let previous: number | undefined, lastFrame: number | undefined;
  let actual: p5.Image | undefined, captured: p5.Image | undefined;
  const dimensions = () => {
    const width = host.clientWidth;
    return {
      width,
      size: Math.max(1, Math.min(400, Math.floor((width - 36) / 2))),
    };
  };
  const update = () => {
    for (const input of [rps, fps, readout, exposure])
      find<HTMLOutputElement>(`${input.id}-value`).value =
        `${input.value} ${input.dataset.unit ?? ""}`;
    const global = settings.mode === "global";
    readout.disabled = global;
    direction.disabled = global;
    find("rs-caption").innerHTML = global
      ? "撮影結果：Global <small>全行を同時に撮影</small>"
      : "撮影結果：Rolling <small>行ごとに時刻をずらして撮影</small>";
    const frame = frameTime(time, Number(fps.value));
    const top = rowTime(frame, 0, SIZE, settings),
      bottom = rowTime(frame, SIZE - 1, SIZE, settings);
    find("rs-timing").textContent =
      `基準 ${time.toFixed(2)} s · フレーム開始 ${frame.toFixed(2)} s ｜ 上端の露光開始 ${top.toFixed(3)} s / 下端 ${bottom.toFixed(3)} s`;
    play.textContent = running ? "停止" : "開始";
    play.disabled = reduced.checked;
  };
  const sketch = new p5((p) => {
    const toImage = (values: Float32Array, image?: p5.Image) => {
      const target = image ?? p.createImage(SIZE, SIZE);
      target.loadPixels();
      for (let i = 0; i < values.length; i++) {
        const v = values[i]!;
        target.pixels[i * 4] = 75 + (255 - 75) * v;
        target.pixels[i * 4 + 1] = 40 + (255 - 40) * v;
        target.pixels[i * 4 + 2] = 109 + (255 - 109) * v;
        target.pixels[i * 4 + 3] = 255;
      }
      target.updatePixels();
      return target;
    };
    p.setup = () => {
      const { width, size } = dimensions();
      p.createCanvas(width, size + 24).parent(host);
      p.pixelDensity(1);
      p.frameRate(24);
      p.noLoop();
      ready = true;
    };
    p.draw = () => {
      if (disposed) return;
      const now = performance.now();
      if (running && !document.hidden && !reduced.checked) {
        if (previous !== undefined) time += (now - previous) / 1000;
        previous = now;
      }
      const frame = frameTime(time, Number(fps.value));
      actual = toImage(
        renderPropeller(SIZE, time, {
          ...settings,
          mode: "global",
          exposure: 0,
        }),
        actual,
      );
      if (dirty || lastFrame !== frame) {
        captured = toImage(renderPropeller(SIZE, frame, settings), captured);
        lastFrame = frame;
        dirty = false;
      }
      const { width, size } = dimensions();
      p.background("#FFFFFF");
      p.image(actual, width / 4 - size / 2, 12, size, size);
      if (captured)
        p.image(captured, (width * 3) / 4 - size / 2, 12, size, size);
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
  const listen = (element: EventTarget, name: string, action: () => void) =>
    element.addEventListener(name, action, { signal: events.signal });
  const readControls = (resetTime: boolean) => {
    settings.mode = mode.value as CameraSettings["mode"];
    settings.direction = direction.value as CameraSettings["direction"];
    settings.rps = Number(rps.value);
    settings.readout = Number(readout.value) / 1000;
    settings.exposure = Number(exposure.value) / 1000;
    if (resetTime) time = 0;
    dirty = true;
    sync();
  };
  for (const control of [rps, fps, readout, exposure])
    listen(control, "input", () => readControls(true));
  for (const control of [mode, direction])
    listen(control, "change", () => readControls(false));
  listen(play, "click", () => {
    running = !running;
    status.textContent = running ? "再生中" : "停止中";
    sync();
  });
  listen(find("rs-step"), "click", () => {
    running = false;
    time = frameTime(time, Number(fps.value)) + 1 / Number(fps.value);
    status.textContent = "1コマ進めました。";
    sync();
  });
  const preset = (name: string) => {
    Object.assign(settings, defaults);
    mode.value = name === "global" ? "global" : "rolling";
    direction.value = "down";
    rps.value = "3";
    fps.value = "12";
    readout.value = "60";
    exposure.value = name === "blur" ? "30" : "0";
    running = false;
    readControls(true);
  };
  listen(find("rs-reset"), "click", () => {
    preset("rolling");
    status.textContent = "初期設定に戻しました。";
  });
  for (const button of root.querySelectorAll<HTMLButtonElement>(
    "[data-rs-preset]",
  ))
    listen(button, "click", () => {
      preset(button.dataset.rsPreset ?? "rolling");
      status.textContent = `「${button.textContent}」の設定にしました。`;
    });
  const reduce = () => {
    if (reduced.checked) running = false;
    status.textContent = reduced.checked
      ? "動きを減らす設定：コマ送りで観察できます。"
      : "停止中";
    sync();
  };
  listen(reduced, "change", reduce);
  listen(media, "change", () => {
    reduced.checked = media.matches;
    reduce();
  });
  listen(document, "visibilitychange", sync);
  const lab = root.querySelector<HTMLElement>(".rolling-lab")!;
  listen(find("rs-fullscreen"), "click", () => {
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
    find("rs-fullscreen").textContent = document.fullscreenElement
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
    actual = undefined;
    captured = undefined;
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
