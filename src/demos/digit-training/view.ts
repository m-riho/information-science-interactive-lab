import { mountDemoLayout } from "../../components/demoLayout";
import { session07Config, session07Materials } from "../../sessions/session07";
import { spark } from "../learning-common/lesson";
import { random } from "../learning-common/model";
import { correspondence } from "./common";
import { loadDigits, loadPretrained } from "./data";
import { createManual, summarize } from "./model";
import type { Engine } from "./types";
import { mountPad } from "./pad";
import "./style.css";

type Mode = "js" | "tf";
interface Split { pixels: Uint8Array; labels: Uint8Array }
function normalize(split: Split, count: number) {
  return {
    x: Float32Array.from(split.pixels.subarray(0, count * 784), v => v / 255),
    y: Float32Array.from(split.labels.subarray(0, count), v => Number(v === 1)),
  };
}
function shuffle(size: number, epoch: number) {
  const order = Array.from({ length: size }, (_, i) => i);
  const rng = random(7 + epoch);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}
const waitForUi = () => new Promise<void>(resolve => setTimeout(resolve, 0));
const pct = (value: number | null) => value === null ? "定義できません" : (100 * value).toFixed(1) + "%";
const names = { js: "JavaScript", tf: "TensorFlow.js" };
const results = new Map<Mode, { settings: string; text: string }>();
const select = (label: string, name: string, values: number[], initial: number) =>
  `<label>${label}<select data-${name}>${values.map(v => `<option ${v === initial ? "selected" : ""}>${v}</option>`).join("")}</select></label>`;

export function mountDigitTraining(root: HTMLElement, mode: Mode) {
  const material = session07Materials.find(m => m.code === (mode === "js" ? "JS13" : "JS14"))!;
  const lifetime = new AbortController();
  let cancel = () => {}, run = (_automatic: boolean) => {}, pause = () => {}, infer = () => {};
  let active = false, generation = 0, imageVersion = 0;
  let dataset: ReturnType<typeof loadDigits> | undefined;
  const layout = mountDemoLayout(root, material, {
    start: () => run(true), step: () => run(false), stop: () => pause(), reset: () => {
      count.value = "2000"; testCount.value = "500"; epochs.value = "3"; rate.value = "0.01";
      source.value = "fresh"; pad.clear(); void reset();
    },
  }, session07Config);
  layout.instructions.textContent = "「学習開始」で数字の1とそれ以外を分類します。「1バッチ更新」なら重みの変化を少しずつ追えます。学習後に数字を描いて判定してください。";
  root.querySelector('[data-action="start"]')!.textContent = "学習開始";
  root.querySelector('[data-action="step"]')!.textContent = "1バッチ更新";
  layout.body.classList.add("digit-work");
  layout.body.innerHTML = `<section class="lesson-panel"><h2>どこを学習する？</h2>
    <div class="flow"><strong>28×28画素（784入力）</strong> → <strong>中間層32個・ReLU</strong> → <strong>出力1個・Sigmoid</strong></div>
    <p>白い画素ほど入力値が大きくなります。出力が0.5以上なら「1」と判定します。</p>
    <div class="transport">${select("訓練画像（枚）","count",[200,1000,2000],2000)}${select("テスト画像（枚）","test-count",[100,500],500)}${select("Epoch数","epochs",[1,3,5],3)}${select("学習率","rate",[.001,.01,.05,.1],.01)}
    <label>開始時の重み<select data-source><option value="fresh">新しく初期化</option><option value="trained">学習済みの重みを読み込む</option></select></label></div>
    <p>両デモで同じ画像・初期重み・順序を使います。訓練・テストとも「1」が半数です。各Epochで訓練画像を並べ替え、32枚ずつ二値交差エントロピーの平均勾配で更新します。設定を変えると最初に戻ります。<a href="${import.meta.env.BASE_URL}data/session07-digits/README.md">MNISTの出典・利用条件・学習済みモデルの作成条件</a></p></section>
    <section class="lesson-panel"><h2>学習の進み方</h2><p data-progress></p><p class="metrics" data-metrics></p><p data-weight></p><div class="lesson-grid" data-charts></div><p>正解率は全画像のうち正しく分類した割合です。「1の再現率」は、テスト画像の本物の1をいくつ拾えたかを表します。</p><p data-comparison></p></section>
    <section class="lesson-panel"><h2>手書き数字を判定する</h2><p>黒い枠に数字を1つ描いてください。前景を切り出し、縦横比を保って縮小し、重心を中央に寄せます。「テスト画像を使う」でも試せます。</p><div data-pad></div><p>出力はモデルが「1」に割り当てた値です。表示が90%でも、正答率90%を意味するとは限りません。</p></section>
    <details class="lesson-panel"><summary>コードで比べる：順伝播から重み更新まで</summary>
    <h3>JavaScriptで各段階を書く（要点を抜粋）</h3><pre>const net = createManual();  // 784入力 → 32 → 1
// 中間層の重み付き和にReLUを適用し、出力にSigmoidを適用
hidden[j] = Math.max(0, hidden[j]);
logit += hidden[j] * parameters[OUTPUT_WEIGHT + j];
const p = 1 / (1 + Math.exp(-logit));
// 二値交差エントロピーと出力側の勾配
const loss = y === 1 ? -Math.log(p) : -Math.log1p(-p);
const outputError = (p - y) / batchSize;
gradient[OUTPUT_WEIGHT + j] += outputError * hidden[j];
// バッチ内の勾配を集計してから全パラメータを同時に更新
const next = parameters.map((w, i) => w - rate * gradient[i]);
// 学習ループから1バッチ分を呼び出す
net.train(images, labels, rate);</pre>
    <h3>TensorFlow.jsで層と学習方法を指定する（抜粋）</h3><pre>const model = tf.sequential();
model.add(tf.layers.dense({
  inputShape: [784], units: 32, activation: "relu"
}));
model.add(tf.layers.dense({units: 1, activation: "sigmoid"}));
model.compile({ optimizer: tf.train.sgd(rate),
  loss: "binaryCrossentropy" });
await model.trainOnBatch(images, labels);
const probabilities = model.predict(images);</pre>
    <p>trainOnBatchは1バッチの順伝播・損失計算・自動微分・重み更新を実行します。predictは重みを保持して出力を求めます。</p></details>
    ${correspondence}`;
  const get = <T extends HTMLElement>(s: string) => layout.body.querySelector<T>(s)!;
  const count = get<HTMLSelectElement>("[data-count]"), testCount = get<HTMLSelectElement>("[data-test-count]");
  const epochs = get<HTMLSelectElement>("[data-epochs]"), rate = get<HTMLSelectElement>("[data-rate]");
  const source = get<HTMLSelectElement>("[data-source]");
  const progress = get("[data-progress]"), metrics = get("[data-metrics]"), weight = get("[data-weight]");
  const charts = get("[data-charts]"), comparison = get("[data-comparison]");
  const pad = mountPad(get("[data-pad]"), lifetime.signal, () => { imageVersion++; get("[data-result]").textContent = ""; });
  const predictButton = get<HTMLButtonElement>("[data-predict]"), example = get<HTMLButtonElement>("[data-example]");
  let sample = () => {};
  example.addEventListener("click", () => sample(), { signal: lifetime.signal });
  predictButton.addEventListener("click", () => infer(), { signal: lifetime.signal });
  function setBusy(busy: boolean) {
    active = busy; predictButton.disabled = busy;
    layout.controls.setCompleted(busy);
  }
  async function reset() {
    const token = ++generation;
    const current = () => token === generation;
    cancel(); cancel = () => {}; pause = () => {}; infer = () => {}; run = () => {};
    layout.controls.setRunning(false); setBusy(true); example.disabled = true;
    for (const el of [charts, progress, metrics, weight, comparison, get("[data-result]")]) el.textContent = "";
    layout.status.textContent = "画像とモデルを準備しています。";
    const trainingSize = Number(count.value), testingSize = Number(testCount.value), goal = Number(epochs.value), eta = Number(rate.value);
    const settings = [trainingSize, testingSize, goal, eta, source.value].join("/");
    let engine: Engine | undefined;
    let working = false, automatic = false, retired = false, elapsed = 0, epoch = 0, offset = 0;
    const release = () => { if (!working && retired && engine) { engine.dispose(); engine = undefined; } };
    cancel = () => { retired = true; automatic = false; release(); };
    function failed(error: unknown) {
      if (!current()) return;
      setBusy(true); layout.controls.setRunning(false);
      layout.status.textContent = `続行できません。リセットで再試行してください。 ${error instanceof Error ? error.message : String(error)}`;
    }
    try {
      dataset ??= loadDigits(lifetime.signal).catch(error => {dataset = undefined; throw error;});
      const raw = await dataset;
      if (!current()) return;
      const initial = source.value === "trained" ? await loadPretrained(lifetime.signal) : undefined;
      if (!current()) return;
      engine = mode === "js" ? createManual(initial) : await (await import("./tfModel")).createTensorFlow(initial);
      if (!current()) { release(); return; }
      const net = engine;
      const train = normalize(raw.train, trainingSize), test = normalize(raw.test, testingSize);
      let order = shuffle(trainingSize, epoch), sampleIndex = 0;
      const losses: number[] = [], accs: number[] = [], testAccs: number[] = [];
      sample = () => {
        const i = sampleIndex++ % testingSize;
        pad.example(test.x.slice(i * 784, (i + 1) * 784));
        get("[data-result]").textContent = `テスト画像の正解ラベル：${raw.test.labels[i]}。判定して予測と比べてください。`;
      };
      example.disabled = false;
      function showProgress() {
        progress.textContent = `完了したEpoch：${epoch} / ${goal}　今のEpochで更新した画像：${offset} / ${trainingSize}枚　学習時間（評価を除く）：${(elapsed / 1000).toFixed(2)}秒`;
      }
      async function evaluate() {
        const tr = summarize(await net.predict(train.x), train.y);
        if (!current()) return;
        const te = summarize(await net.predict(test.x), test.y);
        if (!current()) return;
        losses.push(tr.loss); accs.push(tr.accuracy); testAccs.push(te.accuracy);
        const summary = `訓練損失 ${tr.loss.toFixed(4)} ／ 訓練正解率 ${pct(tr.accuracy)} ／ テスト正解率 ${pct(te.accuracy)} ／ 1の再現率 ${pct(te.recall)}`;
        metrics.textContent = `Epoch ${epoch} 終了時（0は初期値）　${summary}`;
        charts.innerHTML = [spark(losses, "訓練損失"), spark(accs, "訓練正解率（0〜1）"), spark(testAccs, "テスト正解率（0〜1）")].join("");
        if (epoch === goal) results.set(mode, {settings, text: summary});
        const other = mode === "js" ? "tf" : "js", record = results.get(other);
        comparison.textContent = record?.settings === settings ? `同条件で完了した${names[other]}：${record.text}` : `もう一方のデモを同じ設定で完了すると、ここで結果を比較できます。`;
      }
      working = true;
      try { await evaluate(); } finally { working = false; release(); }
      if (!current()) return;
      showProgress(); setBusy(false); layout.status.textContent = initial ? "学習済みモデルで判定できます。学習開始で追加学習します。" : "初期化しました。学習開始または1バッチ更新を押してください。";
      pause = () => { automatic = false; layout.status.textContent = "停止しました。処理中のバッチがあれば完了後に再開できます。"; };
      infer = async () => {
        const image = pad.read();
        if (!image) { get("[data-result]").textContent = "数字を描くか、テスト画像を選んでください。"; return; }
        if (working) return;
        const version = imageVersion;
        working = true; setBusy(true);
        try {
          const p = (await net.predict(image))[0]!;
          if (current() && version === imageVersion) get("[data-result]").textContent = `「1」の推定確率 ${pct(p)}　判定：${p >= .5 ? "1" : "それ以外"}`;
        } catch (e) { failed(e); return; }
        finally { working = false; release(); }
        if (current()) { setBusy(false); layout.controls.setCompleted(epoch === goal); }
      };
      run = async (auto: boolean) => {
        if (working || active || epoch >= goal) return;
        automatic = auto; working = true; setBusy(true); get("[data-result]").textContent = "";
        layout.status.textContent = "ミニバッチごとに重みを更新しています。";
        try {
          do {
            const start = performance.now();
            const batchSize = Math.min(32, trainingSize - offset);
            const x = new Float32Array(batchSize * 784), y = new Float32Array(batchSize);
            for (let j = 0; j < batchSize; j++) {
              const i = order[offset + j]!;
              x.set(train.x.subarray(i * 784, (i + 1) * 784), j * 784); y[j] = train.y[i]!;
            }
            const trace = await net.train(x, y, eta);
            if (!current()) return;
            elapsed += performance.now() - start;
            if (trace) weight.textContent = `直近の更新（中間層の1番目 → 出力の重み）：${trace.before.toPrecision(5)} − ${eta} × (${trace.gradient.toPrecision(5)}) = ${trace.after.toPrecision(5)}`;
            offset += batchSize;
            if (offset === trainingSize) {
              epoch++; offset = 0; order = shuffle(trainingSize, epoch);
              await evaluate(); if (!current()) return;
            }
            showProgress();
            if (automatic && epoch < goal) await waitForUi();
          } while (current() && automatic && epoch < goal);
        } catch (e) { failed(e); return; }
        finally { working = false; release(); }
        if (current()) {
          layout.controls.setRunning(false); setBusy(false); layout.controls.setCompleted(epoch === goal);
          layout.status.textContent = epoch === goal ? "指定したEpochの学習が完了しました。手書き数字を判定できます。" : "バッチの更新が完了しました。ここから再開できます。";
        }
      };
    } catch (e) { failed(e); }
  }
  for (const el of [count,testCount,epochs,rate,source]) el.addEventListener("change", () => void reset(), {signal:lifetime.signal});
  void reset();
  return () => { generation++; cancel(); lifetime.abort(); layout.dispose(); };
}
