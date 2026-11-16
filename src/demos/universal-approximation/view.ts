import { mountDemoLayout } from "../../components/demoLayout";
import { session07Config, session07Materials } from "../../sessions/session07";
import { field, numbers } from "../learning-common/view";
import { targets, construct, grid, errors, samples, initialize, advance, loss, type Target, type Network } from "./model";
import { curveChart, lossChart, type LossRecord } from "./chart";
import "./style.css";

export function mountUniversalApproximation(root: HTMLElement) {
  const material = session07Materials.find(m => m.code === "JS11")!;
  const abort = new AbortController();
  let state = initialize("sin", 8, 7), history: LossRecord[] = [];
  let activeSeed = 7;
  let timer: ReturnType<typeof setInterval> | undefined;
  let failure = "";
  const clear = () => { if (timer !== undefined) clearInterval(timer); timer = undefined; };
  const l = mountDemoLayout(root, material, {
    step: () => update(1),
    start: () => { clear(); timer = setInterval(() => update(25), 100); },
    stop: clear,
    reset: () => {
      mode.value = "construct"; target.value = "sin"; n.value = "8";
      seed.value = "7"; rate.value = ".01"; limit.value = "2000";
      restart();
    },
  }, session07Config);
  l.instructions.textContent = "まずNを変えて、短い直線をつないだ曲線が目標へ近づく様子を見てください。構成モードは重みを計算して作ります。学習モードは乱数から始め、1ステップまたは自動実行で訓練点への誤差を減らします。設定変更で停止・初期化します。";
  l.body.classList.add("ua-demo");
  l.body.innerHTML = `<p>JS11 · 対応スライド：${material.slides}</p>
    <section class="lesson-panel ua-intro"><h2>曲線を「表せる」と、学習で「見つけられる」は別のこと</h2><p>ReLUは、途中で折れ曲がる小さな部品です。部品の出力を足し合わせて曲線を作れます。中間層を1層に固定して、ニューロンの個数と重みの決め方を比べましょう。</p><p><strong>表現能力：</strong>近似する重みが存在するか。<br><strong>最適化：</strong>学習でその重みを見つけられるか。<br><strong>汎化：</strong>学習に使わない点でも合うか。</p></section>
    <div class="ua-grid"><section class="lesson-panel"><h2>目標関数とモデル出力</h2><div class="ua-scroll" tabindex="0" role="region" aria-label="近似曲線のグラフ。狭い画面では横にスクロールできます" data-chart></div><ul class="ua-legend"><li><span class="ua-target">┄</span>破線：目標関数</li><li><span class="ua-model">━</span>実線：ReLUモデル</li><li data-sample-legend>○：訓練点32個 ／ △：未使用評価点124個</li></ul><p data-axis-note></p></section>
    <section class="lesson-panel"><h2>近似の設定</h2><label class="lesson-field">モード<select data-mode><option value="construct">構成：重みを計算して作る</option><option value="learn">学習：データから重みを探す</option></select></label><label class="lesson-field">対象関数<select data-target><option value="sin">sin(x) ／ −π〜π</option><option value="square">x² ／ −1〜1</option><option value="abs">|x| ／ −1〜1</option></select></label>${field("中間ニューロン数 N", "ua-n", 2, 32, 1, 8)}<p data-count></p>
    <div data-learning-settings hidden><label class="lesson-field">乱数シード<input data-seed type="number" min="0" max="4294967295" step="1" value="7" required></label><label class="lesson-field">学習率<select data-rate><option value=".001">0.001</option><option value=".01" selected>0.01</option><option value=".03">0.03</option><option value=".1">0.1</option></select></label>${field("学習更新の上限", "ua-limit", 500, 5000, 500, 2000)}<p>1ステップ＝1回のAdam更新。自動実行は100msごとに25回更新します。停止後は続きから再開できます。</p></div>
    <h2>有限点で測った誤差</h2><div data-metrics></div><p>表示用の固定401点で計算します。最大絶対誤差はこの有限点での最大値であり、区間全体の数学的な上限（sup）ではありません。</p></section></div>
    <section class="lesson-panel" data-learning-results hidden><h2>訓練損失の推移</h2><p data-training-metrics></p><div class="ua-scroll" tabindex="0" role="region" aria-label="訓練損失のグラフ。横軸は更新回数、縦軸はMSE" data-loss></div><p>○訓練32点のMSEだけで更新します。△未使用124点は訓練にも停止判定にも使いません。条件を比較して選ぶ場合は検証用に相当し、最終テストではありません。初期値や学習率によって停滞・悪化することもあります。</p></section>
    <section class="lesson-panel"><h2>普遍近似定理が述べること</h2><p>適切な活性化関数・ネットワーク構成の下で、<strong>コンパクト集合上の連続関数を任意の精度で一様近似できるパラメータが存在する</strong>という結果です。このデモでは1次元の区間上で観察します。</p><p>ニューロン数を増やすと表現の選択肢は増えますが、固定Nで何でも近似できるわけではありません。すべての関数・すべてのNで誤差が単調に減るとも限りません。<strong>学習の成功や未知データでの性能は、この定理では保証されません。</strong>不連続関数を任意の精度で一様近似できるという意味でもありません。</p></section>
    <details class="lesson-panel"><summary>詳しく見る：数式・構成法・各ユニットの重み</summary><p>1入力 → N個のReLU（中間層1層）→ 線形出力。ReLU(z) = max(0,z)。</p><p class="ua-equation">F<sub>N</sub>(x) = c + Σ<sub>i=1…N</sub> a<sub>i</sub> ReLU(w<sub>i</sub>x + b<sub>i</sub>)</p><p>構成では範囲をN等分したN+1節点の値を直線で結びます。区間ごとの傾きをm₀,…,m<sub>N−1</sub>とすると、先頭の傾きと各折れ目の「傾きの変化」をReLUで足せます。</p><p class="ua-equation">F(x) = f(L) + m₀ ReLU(x−L) + Σ<sub>j=1…N−1</sub> (m<sub>j</sub>−m<sub>j−1</sub>) ReLU(x−t<sub>j</sub>)</p><p>境界用1個＋内部用N−1個＝N個。係数0のユニットも含みます。線形出力のバイアスcはニューロン数Nに含めません。構成モードは訓練ではありません。区間の外へ延長した値に近似保証はありません。</p><p>学習では同じ構造の全w,b,a,cを全バッチAdam（β₁=.9、β₂=.999、ε=10⁻⁸、勾配ノルム上限10）で更新します。ReLUの0での微分は0。シード付き乱数で初期化し、事前に作った正解曲線には置き換えません。</p><p data-bias></p><div class="ua-scroll" tabindex="0" role="region" aria-label="ReLUユニットのパラメータ表" data-parameters></div></details>
    <section class="lesson-panel"><h2>考えてみよう</h2><ul><li>ニューロン数を増やすと、表現できる曲線の種類はどう変わるか？</li><li>構成モードでうまく近似できても、学習モードで必ず同じ結果になるか？</li><li>訓練点でよく合っていても、訓練点の間や未使用の点で同じように合うか？</li></ul></section>
    <details class="lesson-panel"><summary>参考文献</summary><ul><li><a href="https://doi.org/10.1007/BF02551274">Cybenko (1989), Approximation by Superpositions of a Sigmoidal Function</a>（シグモイドによる歴史的結果）</li><li><a href="https://doi.org/10.1016/0893-6080(91)90009-T">Hornik (1991), Approximation Capabilities of Multilayer Feedforward Networks</a></li><li><a href="https://doi.org/10.1016/S0893-6080(05)80131-5">Leshno et al. (1993), Multilayer Feedforward Networks with a Nonpolynomial Activation Function Can Approximate Any Function</a></li></ul><p>理論の背景資料です。本デモの特定の学習結果を保証するものではありません。</p></details>`;
  const mode = l.body.querySelector<HTMLSelectElement>("[data-mode]")!;
  const target = l.body.querySelector<HTMLSelectElement>("[data-target]")!;
  const n = l.body.querySelector<HTMLInputElement>("#ua-n")!;
  const seed = l.body.querySelector<HTMLInputElement>("[data-seed]")!;
  const rate = l.body.querySelector<HTMLSelectElement>("[data-rate]")!;
  const limit = l.body.querySelector<HTMLInputElement>("#ua-limit")!;
  const slot = (name: string) => l.body.querySelector<HTMLElement>(`[data-${name}]`)!;
  const controls = root.querySelector<HTMLElement>('[data-slot="controls"]')!;
  const id = (): Target => target.value === "square" ? "square" : target.value === "abs" ? "abs" : "sin";
  const learning = () => mode.value === "learn";
  const finite = (v: number) => Math.abs(v) < 1e-10 ? "0" : v.toPrecision(5);
  function stop() { clear(); l.controls.setRunning(false); }
  function render() {
    numbers(l.body);
    const learn = learning(), net: Network = learn ? state.net : construct(id(), Number(n.value));
    const data = samples(id()), metric = errors(net, grid(id()));
    controls.classList.toggle("ua-construct-controls", !learn);
    for (const name of ["learning-settings", "learning-results", "sample-legend"]) slot(name).hidden = !learn;
    slot("chart").innerHTML = curveChart(net, id(), learn ? data.train : [], learn ? data.evaluation : []);
    slot("axis-note").textContent = `横軸x：${targets[id()].min.toFixed(3)}〜${targets[id()].max.toFixed(3)}。縦軸yは現在の曲線が収まる範囲に自動調整します。`;
    slot("count").textContent = learn ? `実際のReLUユニット：${net.units.length}個。すべての重みとバイアスを学習します。` : `実際のReLUユニット：${net.units.length}個（境界用1個＋内部用${net.units.length - 1}個）。${net.units.length + 1}節点、${net.units.length}区間で構成。`;
    slot("metrics").innerHTML = `<dl class="ua-metrics"><dt>最大絶対誤差（表示401点）</dt><dd>${finite(metric.maxAbs)}</dd><dt>平均二乗誤差 MSE（表示401点）</dt><dd>${finite(metric.mse)}</dd></dl>`;
    if (learn) {
      slot("training-metrics").textContent = `更新 ${state.step} / ${limit.value}回 ／ 訓練MSE：${finite(loss(net, data.train))} ／ 未使用評価MSE：${finite(loss(net, data.evaluation))} ／ 初期化シード：${activeSeed}`;
      slot("loss").innerHTML = lossChart(history, Number(limit.value));
    }
    slot("bias").textContent = `出力バイアス c = ${finite(net.c)}`;
    slot("parameters").innerHTML = `<table class="per-table"><caption>実際のReLUユニット ${net.units.length}個の全パラメータ</caption><thead><tr><th scope="col">i</th><th scope="col">wᵢ</th><th scope="col">bᵢ</th><th scope="col">aᵢ</th></tr></thead><tbody>${net.units.map((u, i) => `<tr><th scope="row">${i + 1}</th><td>${finite(u.w)}</td><td>${finite(u.b)}</td><td>${finite(u.a)}</td></tr>`).join("")}</tbody></table>`;
    l.controls.setCompleted(!learn || !!failure || state.step >= Number(limit.value));
    l.status.textContent = failure || (learn ? `学習モード：乱数から始めた同じReLUモデルを、訓練点の誤差で${state.step}回更新しました。${state.step >= Number(limit.value) ? "指定上限で停止しました。設定変更またはリセットで再開できます。" : "学習の成功は保証されません。"}` : `構成モード：学習は行わず、${n.value}個のReLUの重みを節点の値から計算しました。Nを変えたときの実測誤差を比較してください。`);
  }
  function restart() {
    stop(); failure = "";
    if (!seed.checkValidity()) {
      failure = "乱数シードは0〜4294967295の整数を入力してください。修正まで停止します。";
    } else activeSeed = Number(seed.value);
    state = initialize(id(), Number(n.value), activeSeed);
    history = [{ step: 0, loss: loss(state.net, samples(id()).train) }];
    render();
  }
  function update(count: number) {
    if (!learning() || failure) return;
    const data = samples(id()).train;
    try {
      for (let i = 0; i < count && state.step < Number(limit.value); i++) {
        const next = advance(state, data, Number(rate.value), Number(limit.value), 1);
        const value = loss(next.net, data);
        if (!Number.isFinite(value)) throw new RangeError("数値が有限範囲を超えました。直前の状態で停止します。");
        state = next; history.push({ step: state.step, loss: value });
      }
    } catch (error) { failure = error instanceof Error ? error.message : "計算を停止しました。"; }
    if (failure || state.step >= Number(limit.value)) stop();
    render();
  }
  for (const input of [mode, target, seed, rate]) input.addEventListener("change", restart, { signal: abort.signal });
  for (const input of [n, limit]) input.addEventListener("input", restart, { signal: abort.signal });
  seed.addEventListener("input", restart, { signal: abort.signal });
  restart();
  return () => { stop(); abort.abort(); l.dispose(); };
}
