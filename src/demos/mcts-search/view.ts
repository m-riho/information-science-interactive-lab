import { lesson } from "../learning-common/lesson";
import { field, numbers } from "../learning-common/view";
import { explore, leafValues } from "./model";
export function mountMCTS(root: HTMLElement) {
  let show = false;
  const abort = new AbortController();
  const l = lesson(
    root,
    2,
    `<div class="lesson-grid"><section class="lesson-panel">${field("Aの事前確率", "mcts-prior", 0.1, 0.9, 0.05, 0.7)}<p>BとCには残りを等分します。事前確率の変更で探索回数は0に戻ります。</p><button data-result-button>探索結果を表示</button><p data-comparison></p></section><section class="lesson-panel"><div data-tree></div></section></div><div data-table></div><p>1ステップは経路を1本選ぶ→未訪問の葉を調べる→評価を親へ返す、という1探索です。最大100回で停止します。枝の太さは探索回数N、Qは得た評価の平均です。</p><details><summary>このモデルとAlphaGoの関係</summary><p>小さな一人用の木で、PUCT型の選択（Q + 1.4 × P × √(親のN+1)/(1+枝のN)）を使います。Pと葉の評価は教材用の仮想値であり、ニューラルネットワークや囲碁を実行しません。葉の値は予測値で、実際の勝敗や最善手を保証しません。</p><p>2016年AlphaGoは人の棋譜からの学習も利用し、方策・価値ネットワークを探索と組み合わせました。2017年AlphaGo Zeroは人の対局データを使わず自己対局から学ぶ方法です。この図をどちらかの実装そのものとして扱わないでください。</p><p>参考：<a href="https://storage.googleapis.com/deepmind-media/alphago/AlphaGoNaturePaper.pdf">AlphaGo論文（2016）</a>、<a href="https://www.nature.com/articles/nature24270">AlphaGo Zero論文（2017）</a></p></details>`,
    () => {
      prior.value = ".7";
      show = false;
      restart();
    },
    "方策の事前確率だけで選ぶ場合と、探索した結果を使う場合を比べます。1ステップで1回探索し、枝の回数と平均評価を更新します。",
  );
  const prior = l.body.querySelector<HTMLInputElement>("#mcts-prior")!;
  let redraw = () => {};
  function restart() {
    numbers(l.body);
    const { priors, frames } = explore(Number(prior.value));
    l.setFrames(frames.length, (i) => {
      const f = frames[i]!;
      redraw = () => {
        const predicted = priors.indexOf(Math.max(...priors)),
          chosen = f.nodes.reduce(
            (b, s, j) => (s.n > f.nodes[b]!.n ? j : b),
            0,
          );
        l.body.querySelector("[data-comparison]")!.textContent =
          `事前確率のみ：${["A", "B", "C"][predicted]}。` +
          (show
            ? i === 0
              ? "まだ探索していません。"
              : `探索回数最多の手：${["A", "B", "C"][chosen]}（N=${f.nodes[chosen]!.n}）。`
            : "「探索結果を表示」で探索回数最多の手を確認できます。");
        l.body.querySelector("[data-tree]")!.innerHTML =
          `<svg class="ml-plot" viewBox="0 0 480 300" role="img" aria-label="根からA・B・C、その先の2枚の葉への探索木"><text x="185" y="24">根：N=${f.iterations}</text>${f.nodes
            .map((n, a) => {
              const x = 80 + a * 160;
              return `<line x1="240" y1="35" x2="${x}" y2="100" stroke="var(--brand)" stroke-width="${1 + Math.sqrt(n.n)}"/><rect x="${x - 55}" y="85" width="110" height="60" rx="8" fill="${f.selected === a ? "var(--brand-light)" : "white"}" stroke="var(--brand)"/><text x="${x - 45}" y="105">${["A", "B", "C"][a]} P=${priors[a]!.toFixed(2)}</text><text x="${x - 45}" y="125">N=${n.n} Q=${n.q.toFixed(2)}</text>${f.leaves[
                a
              ]!.map((s, b) => {
                const xx = x - 35 + b * 70;
                return `<line x1="${x}" y1="145" x2="${xx}" y2="215" stroke="var(--brand)" stroke-width="${1 + Math.sqrt(s.n)}"/><text x="${xx - 25}" y="232">${["A", "B", "C"][a]}${b + 1}</text><text x="${xx - 25}" y="250">v=${leafValues[a]![b]}</text>`;
              }).join("")}`;
            })
            .join("")}</svg>`;
        l.body.querySelector("[data-table]")!.innerHTML =
          `<table class="per-table"><caption>根からの行動</caption><thead><tr><th>行動</th><th>事前P</th><th>平均Q</th><th>探索N</th></tr></thead><tbody>${f.nodes.map((s, j) => `<tr><th>${["A", "B", "C"][j]}</th><td>${priors[j]!.toFixed(2)}</td><td>${s.q.toFixed(2)}</td><td>${s.n}</td></tr>`).join("")}</tbody></table><table class="per-table"><caption>葉の評価・探索回数（葉の事前確率は各0.5）</caption><thead><tr><th>葉</th><th>仮想評価v</th><th>平均Q</th><th>探索N</th></tr></thead><tbody>${f.leaves.flatMap((row, a) => row.map((s, b) => `<tr><th>${["A", "B", "C"][a]}${b + 1}</th><td>${leafValues[a]![b]}</td><td>${s.q.toFixed(2)}</td><td>${s.n}</td></tr>`)).join("")}</tbody></table>`;
        l.status.textContent = f.message + (i === 100 ? "100探索で停止。" : "");
      };
      redraw();
    });
  }
  prior.addEventListener(
    "input",
    () => {
      show = false;
      restart();
    },
    { signal: abort.signal },
  );
  l.body.querySelector("[data-result-button]")!.addEventListener(
    "click",
    () => {
      show = true;
      redraw();
    },
    { signal: abort.signal },
  );
  l.setIntervalMs(150);
  restart();
  return () => {
    abort.abort();
    l.dispose();
  };
}
