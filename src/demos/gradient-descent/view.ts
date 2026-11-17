import { mountStepLesson } from "../../components/stepLesson";
import { session07Config, session07Materials } from "../../sessions/session07";
import { correspondence } from "../digit-training/common";
import { field, numbers } from "../learning-common/view";
import { formatNumber, mountDescentChart } from "./chart";
import { descentTrace, escapeBound, extrema, maxUpdates, slopeTolerance } from "./model";

const defaultX = 1, defaultRate = 0.05;
const rates = [0.001, 0.01, 0.05, 0.1, 0.5];

export function mountGradientDescent(root: HTMLElement) {
  const meta = session07Materials.find(m => m.slug === "gradient-descent")!;
  const lesson = mountStepLesson(root, meta, () => {
    initial.value = String(defaultX);
    rate.value = String(defaultRate);
    restart();
  }, session07Config);
  const abort = new AbortController();
  lesson.setIntervalMs(200);
  lesson.instructions.textContent =
    "初期値と学習率を選び、「1ステップ」でグラフ上の点がどちらへ動くか確かめます。「自動実行」中は「停止」で一時停止できます。設定を変えると初期値からやり直します。";
  lesson.body.innerHTML = `
    <div class="lesson-grid">
      <section class="lesson-panel">
        <h2>関数と探索位置</h2>
        <p>f(x) = x⁴ − 4x² + x + 5</p>
        <svg class="ml-plot" viewBox="0 0 445 280" role="img" data-graph></svg>
        <p>○ 現在地　◇ 極小点　△ 極大点<br>橙色の一点鎖線は現在地での接線です。破線は移動履歴、小さな点は直近の位置です。</p>
        <p>グラフの x = −2〜2 の範囲をクリックしても初期値を選べます。探索が枠を越えると軸を広げます。</p>
      </section>
      <section class="lesson-panel">
        <h2>探索の設定</h2>
        ${field("初期値 x₀", "descent-initial", -2, 2, 0.01, defaultX)}
        <label class="lesson-field">学習率 η<select data-rate>${rates.map(r => `<option value="${r}" ${r === defaultRate ? "selected" : ""}>${r}</option>`).join("")}</select></label>
        <h2>現在の値</h2>
        <div class="lesson-value" data-values></div>
        <p>更新式　xₙ₊₁ = xₙ − η f′(xₙ)</p>
        <p class="lesson-value" data-update></p>
        <small>数値は表示時に丸めています。</small>
      </section>
    </div>
    <section class="lesson-panel">
      <h2>傾きから次の一歩を決める</h2>
      <p>導関数は f′(x) = 4x³ − 8x + 1 です。その点での傾きが正なら右へ少し進むと関数値が増え、負なら減ります。そこで、傾きが正なら左へ、負なら右へ動かします。歩幅は学習率 η と傾きの大きさの積です。</p>
      <p>初期値を −1 と 1 に切り替え、どの谷に着くか比べてみましょう。学習率を 0.5 にすると、谷を飛び越えて振動し、関数値が増える様子も観察できます。</p>
      <p>|f′(x)| ≤ ${slopeTolerance} で停止します。発散が見られる場合は |x| &gt; ${escapeBound} で打ち切り、更新は最大 ${maxUpdates} 回までとします。</p>
    </section>
    <section class="lesson-panel">
      <h2>極値の候補を調べる</h2>
      <p>数学的には f′(x) = 0 を満たす点を求め、前後の傾きの符号を調べます。負から正なら極小、正から負なら極大です。微分係数が 0 でも極小値とは限りません。勾配降下法は、選んだ初期値から傾きをたどる数値的な探索です。</p>
      <table class="per-table"><caption>この関数の極値（近似値）</caption>
        <thead><tr><th scope="col">種類</th><th scope="col">位置 x</th><th scope="col">値 f(x)</th></tr></thead>
        <tbody>${extrema.map(p => `<tr><th scope="row">${p.kind === "minimum" ? "◇ 極小" : "△ 極大"}</th><td>${formatNumber(p.x)}</td><td>${formatNumber(p.value)}</td></tr>`).join("")}</tbody>
      </table>
    </section>
    <p>JS13・JS14 では、損失関数 L が小さくなる方向へ、それぞれの重み w を w ← w − η ∂L/∂w で更新します。偏微分 ∂L/∂w は、ほかの重みを固定してその重みだけを動かしたときの傾きです。</p>
    ${correspondence}`;
  const initial = lesson.body.querySelector<HTMLInputElement>("#descent-initial")!;
  const rate = lesson.body.querySelector<HTMLSelectElement>("[data-rate]")!;
  const svg = lesson.body.querySelector<SVGSVGElement>("[data-graph]")!;
  const chart = mountDescentChart(svg);
  const values = lesson.body.querySelector<HTMLElement>("[data-values]")!;
  const update = lesson.body.querySelector<HTMLElement>("[data-update]")!;

  function restart() {
    numbers(lesson.body);
    const eta = Number(rate.value);
    const trace = descentTrace(Number(initial.value), eta);
    lesson.setFrames(trace.points.length, index => {
      const current = trace.points[index]!;
      const last = index === trace.points.length - 1;
      chart.render(trace.points, index);
      values.innerHTML = `更新 ${index} 回　学習率 η = ${eta}<br>x = ${formatNumber(current.x)}<br>f(x) = ${formatNumber(current.value)}<br>接線の傾き f′(x) = ${formatNumber(current.slope)}`;
      const before = index === 0 ? current : trace.points[index - 1]!;
      const after = index === 0 ? trace.points[1] : current;
      update.textContent = after
        ? `${index === 0 ? "次の更新" : `${index}回目の更新`}　${formatNumber(before.x)} − ${eta} × (${formatNumber(before.slope)}) ≈ ${formatNumber(after.x)}`
        : "初期位置で停止条件を満たしています。";
      if (last) {
        const reasons = {
          stationary: "傾きの絶対値が停止基準に達しました。表の極値と現在地を比較してください。",
          diverged: "発散を検出して停止しました。学習率を小さくするとどう変わるか試してください。",
          limit: "更新上限に達したため、探索を打ち切りました。",
        };
        lesson.status.textContent = `${index}回更新。 ${reasons[trace.reason]}`;
      } else if (index === 0) {
        lesson.status.textContent = `初期値 x = ${current.x}、学習率 η = ${eta}。次の一歩の向きを予想してください。`;
      } else {
        lesson.status.textContent = `${index}回目は${current.x > before.x ? "右" : "左"}に進み、f(x) は${formatNumber(before.value)} から ${formatNumber(current.value)} に変わりました。`;
      }
    });
  }
  initial.addEventListener("input", restart, { signal: abort.signal });
  rate.addEventListener("change", restart, { signal: abort.signal });
  svg.addEventListener("click", event => {
    const x = chart.xAt(event);
    if (x === null || x < -2 || x > 2) return;
    initial.value = String(Math.round(x * 100) / 100);
    restart();
  }, { signal: abort.signal });
  restart();
  return () => { abort.abort(); lesson.dispose(); };
}
