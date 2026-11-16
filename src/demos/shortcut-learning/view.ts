import { lesson, percent } from "../learning-common/lesson";
import { field, numbers } from "../learning-common/view";
import { samples, train, accuracy, probability, type Example } from "./model";
function examples(data: readonly Example[], w: readonly number[], bg: boolean) {
  return `<table class="per-table"><caption>例の一部（形特徴は猫寄り0／犬寄り1）</caption><thead><tr><th>正解</th><th>形特徴</th><th>背景</th><th>予測</th></tr></thead><tbody>${data
    .slice(0, 8)
    .map(
      (e) =>
        `<tr><td>${e.animal ? "犬" : "猫"}</td><td>${e.shape}</td><td>${e.background ? "屋外" : "室内"}</td><td>${probability(e, w, bg) >= 0.5 ? "犬" : "猫"}</td></tr>`,
    )
    .join("")}</tbody></table>`;
}
export function mountShortcut(root: HTMLElement) {
  const abort = new AbortController();
  let weights: readonly number[] = [0, 0, 0],
    trainingData = samples(1),
    isBg = true;
  const l = lesson(
    root,
    9,
    `<div class="lesson-grid"><section class="lesson-panel">${field("猫=室内・犬=屋外の割合（％）", "shortcut-bias", 50, 100, 5, 100)}<label class="check"><input data-bg type="checkbox" checked>背景特徴を学習に使う</label><p>形特徴は約75％で正解の動物と一致する仮想の数値特徴です。訓練標本は200例、シード7。</p><p>上の「自動実行」または「1ステップ」で学習します。</p><p data-weights></p><div data-training></div></section><section class="lesson-panel"><label class="lesson-field">未知データの背景<select data-eval><option value="reverse">猫=屋外、犬=室内に反転</option><option value="balanced">背景と動物をほぼ無関係にする</option></select></label><button data-evaluate>未知データで評価</button><div data-evaluation></div></section></div><p>ロジスティック回帰で形・背景の重みを更新します。1ステップ＝10更新、300更新で停止。設定変更時には学習を最初からやり直します。未知データは学習に使いません。背景を使わない場合でも、形特徴の誤りがあるため正解率100％にはなりません。</p><p>実画像や画像認識モデルの内部を再現するものではなく、ショートカット学習を説明するための単純化したモデルです。</p>`,
    () => {
      bias.value = "100";
      bg.checked = true;
      condition.value = "reverse";
      restart();
    },
    "背景の偏りと利用の有無を選び、学習を進めます。「未知データで評価」で条件が変わった場合を調べてください。",
  );
  const bias = l.body.querySelector<HTMLInputElement>("#shortcut-bias")!,
    bg = l.body.querySelector<HTMLInputElement>("[data-bg]")!,
    condition = l.body.querySelector<HTMLSelectElement>("[data-eval]")!,
    evalBtn = l.body.querySelector<HTMLButtonElement>("[data-evaluate]")!;
  function evaluate() {
    const data = samples(condition.value === "reverse" ? 0 : 0.5, 100);
    l.body.querySelector("[data-evaluation]")!.innerHTML =
      `<p class="storage-result">未知データ正解率：${percent(accuracy(data, weights, isBg))}</p>` +
      examples(data, weights, isBg);
    l.status.textContent =
      "現在の重みを使って、学習に使わなかった200例を評価しました。";
  }
  function restart() {
    numbers(l.body);
    trainingData = samples(Number(bias.value) / 100);
    isBg = bg.checked;
    const fs = train(trainingData, isBg);
    l.body.querySelector("[data-evaluation]")!.textContent =
      "学習を進めてから評価してください。";
    l.setFrames(fs.length, (i) => {
      weights = fs[i]!;
      evalBtn.disabled = i === 0;
      l.body.querySelector("[data-weights]")!.textContent =
        `更新${i * 10}回。バイアス${weights[0]!.toFixed(2)}／形重み${weights[1]!.toFixed(2)}／背景重み${weights[2]!.toFixed(2)}`;
      l.body.querySelector("[data-training]")!.innerHTML =
        `<p class="storage-result">訓練正解率：${percent(accuracy(trainingData, weights, isBg))}</p>` +
        examples(trainingData, weights, isBg);
      l.body.querySelector("[data-evaluation]")!.textContent =
        "「未知データで評価」で現在の重みを評価できます。";
      l.status.textContent = `${i * 10}回更新しました。${i === fs.length - 1 ? "300更新で停止。" : ""}`;
    });
  }
  bias.addEventListener("input", restart, { signal: abort.signal });
  bg.addEventListener("change", restart, { signal: abort.signal });
  condition.addEventListener(
    "change",
    () => {
      l.body.querySelector("[data-evaluation]")!.textContent =
        "評価条件を変えました。「未知データで評価」を押してください。";
    },
    { signal: abort.signal },
  );
  evalBtn.addEventListener("click", evaluate, { signal: abort.signal });

  l.setIntervalMs(150);
  restart();
  return () => {
    abort.abort();
    l.dispose();
  };
}
