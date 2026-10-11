import p5 from "p5";
import { angleAt, apparentRps, nextFrameTime, sampleTime } from "./model";

export function mountWheel(root: HTMLElement): () => void {
  root.innerHTML = `<a class="back" href="#/sessions/03">← 第3回のデモ一覧</a>
    <div class="page-heading"><p class="eyebrow">DEMO 01 / 時間の標本化</p><h1>回転円盤とフレームレート</h1><p class="lead">前に回っているのに、逆に見える？</p></div>
    <p class="goal"><strong>学習目標</strong>　一定の間隔で動きを切り取ると、本来とは違う動きに見えることを説明できる。</p>
    <section class="lab" aria-label="円盤の実験"><div class="lab-bar"><span>観察してみよう <small>正の回転 ＝ 時計回り</small></span><button id="fullscreen">全画面表示</button></div>
    <div class="visual-labels"><div>基準の回転 <small>描画できる頻度で表示</small></div><div>カメラ映像 <small>指定fpsで撮影・保持</small></div></div>
    <div id="canvas-host" role="img" aria-label="左に基準の円盤、右に撮影した円盤。円盤の三角マークの位置を比較します。"></div>
    <div class="readings"><div>実際の回転数<strong id="actual"></strong></div><div>見かけの回転数<strong id="apparent"></strong></div></div>
    <div class="controls"><div class="presets" aria-label="実験プリセット"><span>まずは試す</span><button data-preset="1">正回転</button><button data-preset="12">静止に見える</button><button data-preset="11">逆回転に見える</button></div>
    <div class="sliders">${slider("rps", "回転速度", -24, 24, 0.1, 1, "rps")}${slider("fps", "撮影フレームレート", 1, 60, 1, 12, "fps")}${slider("speed", "再生速度", 0.1, 2, 0.1, 1, "倍")}</div>
    <div class="transport"><button class="primary" id="play">開始</button><button id="step">1コマ進める</button><button id="reset">リセット</button><label class="check"><input type="checkbox" id="reduced">動きを減らす</label><output id="clock" aria-live="off">撮影コマ 0 · 時刻 0.00 s</output></div><p id="status" class="status" role="status">停止中。開始するか、1コマずつ観察してください。</p></div></section>
    <p class="hint">操作：スライダーは矢印キーでも調整できます。設定を変えると時刻が0に戻ります。1コマ送りは撮影間隔ぶん進みます。</p>
    <div class="learning-grid"><section><p class="eyebrow">OBSERVE</p><h2>予想 → 操作 → 説明</h2>
    <details><summary>① 12 rpsを12 fpsで撮ると、どう見える？</summary><p>「静止に見える」を押して開始。撮影するたびにちょうど1周するので、マークは同じ場所に写ります。</p></details>
    <details><summary>② 11 rpsを12 fpsで撮ると、どちらに進む？</summary><p>「逆回転に見える」を選び、1コマずつ進めましょう。毎回11/12周先の姿は、1/12周戻った姿と同じです。</p></details>
    <details><summary>③ fpsを上げると、本来の動きに近づく？</summary><p>11 rpsのままfpsを30にします。1コマの回転が半周未満になると、このモデルでは回転方向を正しく読み取れます。</p></details></section>
    <section><p class="eyebrow">UNDERSTAND</p><h2>なぜそうなる？</h2><p>動画は、一定の時間間隔で撮った静止画の集まりです。このように値を間引いて取り出すことを「標本化」と呼びます。</p><p>撮影の間に進んだ回転数は、画像だけでは分かりません。別の速さや方向に見える現象が「エイリアシング」です。</p><details><summary>数式とモデルの条件を見る</summary><p>見かけの回転数 = r − fps × floor(r / fps + 1/2)。範囲は −fps/2以上、fps/2未満です。</p><p>非対称マークが1回転で同じ姿に戻るモデルです。ちょうど半周ずつ進む境界では、正逆の方向を一意に決められません。表示は負側を採用します。</p><p>再生速度は両方の時間を同じ倍率で進めます。回転数表示は模擬時間1秒あたりの値です。</p></details></section></div>
    <p class="note">基準画像も実際の画面更新頻度に制限され、高速回転では滑らかに見えない場合があります。模擬撮影fpsと画面の描画頻度は別です。非表示タブでは時間を止めます。</p>`;
  const find = <T extends HTMLElement>(id: string) => {
    const element = root.querySelector<T>(`#${id}`);
    if (!element) throw new Error(id);
    return element;
  };
  const rps = find<HTMLInputElement>("rps");
  const fps = find<HTMLInputElement>("fps");
  const speed = find<HTMLInputElement>("speed");
  const reduced = find<HTMLInputElement>("reduced");
  const play = find<HTMLButtonElement>("play");
  const host = find<HTMLDivElement>("canvas-host");
  const lab = root.querySelector<HTMLElement>(".lab")!;
  const events = new AbortController();
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  reduced.checked = media.matches;
  let time = 0;
  let running = false;
  let previous: number | undefined;
  let disposed = false;
  const update = () => {
    for (const input of [rps, fps, speed])
      find<HTMLOutputElement>(`${input.id}-value`).value =
        `${input.value} ${input.dataset.unit ?? ""}`;
    find("actual").textContent = `${Number(rps.value).toFixed(1)} rps`;
    const apparent = apparentRps(Number(rps.value), Number(fps.value));
    find("apparent").textContent =
      `${apparent.toFixed(1)} rps · ${Math.abs(apparent) < 1e-8 ? "静止" : apparent > 0 ? "正回転" : "逆回転"}`;
    find("clock").textContent =
      `撮影コマ ${Math.round(sampleTime(time, Number(fps.value)) * Number(fps.value))} · 時刻 ${time.toFixed(2)} s`;
    play.textContent = running ? "停止" : "開始";
    play.disabled = reduced.checked;
  };
  const sketch = new p5((p) => {
    const disk = (x: number, y: number, r: number, angle: number) => {
      p.push();
      p.translate(x, y);
      p.noFill();
      p.stroke("#DDD4E6");
      p.strokeWeight(1);
      p.circle(0, 0, r * 2 + 18);
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        p.line(
          Math.cos(a) * (r + 10),
          Math.sin(a) * (r + 10),
          Math.cos(a) * (r + 15),
          Math.sin(a) * (r + 15),
        );
      }
      p.rotate(angle);
      p.fill("#F2ECF7");
      p.stroke("#4B286D");
      p.strokeWeight(2);
      p.circle(0, 0, r * 2);
      p.strokeWeight(1);
      p.line(0, 0, r * 0.68, 0);
      p.fill("#4B286D");
      p.triangle(r * 0.9, 0, r * 0.58, -r * 0.16, r * 0.58, r * 0.16);
      p.noStroke();
      p.fill("#8060A8");
      p.circle(-r * 0.35, -r * 0.35, r * 0.13);
      p.fill("#32184C");
      p.circle(0, 0, 10);
      p.pop();
    };
    p.setup = () => {
      p.createCanvas(
        host.clientWidth,
        Math.max(180, Math.min(340, host.clientWidth * 0.36)),
      ).parent(host);
      p.pixelDensity(1);
      p.frameRate(60);
      p.noLoop();
    };
    p.draw = () => {
      const now = performance.now();
      if (running && !document.hidden && !reduced.checked) {
        if (previous !== undefined)
          time += ((now - previous) / 1000) * Number(speed.value);
        previous = now;
      }
      p.background("#FFFFFF");
      const radius = Math.min(p.width * 0.17, p.height * 0.36);
      disk(
        p.width * 0.25,
        p.height * 0.5,
        radius,
        angleAt(Number(rps.value), time),
      );
      disk(
        p.width * 0.75,
        p.height * 0.5,
        radius,
        angleAt(Number(rps.value), sampleTime(time, Number(fps.value))),
      );
      update();
    };
  }, host);
  const sync = () => {
    previous = undefined;
    if (running && !document.hidden && !reduced.checked) sketch.loop();
    else {
      sketch.noLoop();
      sketch.redraw();
    }
    update();
  };
  const listen = (element: EventTarget, name: string, callback: () => void) =>
    element.addEventListener(name, callback, { signal: events.signal });
  listen(play, "click", () => {
    running = !running;
    find("status").textContent = running ? "再生中" : "停止中";
    sync();
  });
  listen(find("step"), "click", () => {
    running = false;
    time = nextFrameTime(time, Number(fps.value));
    find("status").textContent = "1コマ進めました";
    sync();
  });
  listen(find("reset"), "click", () => {
    running = false;
    time = 0;
    rps.value = "1";
    fps.value = "12";
    speed.value = "1";
    find("status").textContent = "初期設定に戻しました";
    sync();
  });
  for (const input of [rps, fps, speed])
    listen(input, "input", () => {
      time = 0;
      sync();
    });
  for (const button of root.querySelectorAll<HTMLButtonElement>(
    "[data-preset]",
  ))
    listen(button, "click", () => {
      rps.value = button.dataset.preset ?? "1";
      fps.value = "12";
      time = 0;
      sync();
    });
  listen(reduced, "change", () => {
    if (reduced.checked) running = false;
    find("status").textContent = reduced.checked
      ? "動きを減らす設定：1コマ送りで観察できます"
      : "停止中";
    sync();
  });
  listen(media, "change", () => {
    reduced.checked = media.matches;
    if (reduced.checked) running = false;
    sync();
  });
  listen(document, "visibilitychange", sync);
  listen(find("fullscreen"), "click", () => {
    void (async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (lab.requestFullscreen) await lab.requestFullscreen();
        else throw new Error("unsupported");
      } catch {
        find("status").textContent =
          "このブラウザでは全画面表示を利用できません。";
      }
    })();
  });
  listen(document, "fullscreenchange", () => {
    find("fullscreen").textContent = document.fullscreenElement
      ? "全画面を終了"
      : "全画面表示";
  });
  const observer = new ResizeObserver(() => {
    if (!disposed) {
      sketch.resizeCanvas(
        host.clientWidth,
        Math.max(180, Math.min(340, host.clientWidth * 0.36)),
      );
      sketch.redraw();
    }
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
