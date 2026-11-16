import { inspectNetwork } from "./model";
const format = (x: number) => x.toFixed(3);
export function renderNetwork(
  w: readonly number[],
  x: number,
  y: number,
  multi: boolean,
  epoch: number,
) {
  const data = inspectNetwork(w, x, y, multi);
  const card = (
    name: string,
    weights: readonly number[],
    bias: number,
    sum: number,
    value: number,
    left: number,
    top: number,
    activation: string,
  ) => {
    const sources =
      multi && name === "y" ? ["h₁", "h₂", "h₃", "h₄"] : ["x₁", "x₂"];
    return `<section class="xor-node" style="left:${left}px;top:${top}px"><h3>${name} · ${activation}</h3><p>${weights.map((v, i) => `w(${sources[i]}) = ${format(v)}`).join("<br>")}<br>b = ${format(bias)}</p><p>重み付き和 = ${format(sum)}<br><strong>出力 = ${format(value)}</strong></p></section>`;
  };
  const edge = (a: number, b: number, c: number, d: number) =>
    `<path d="M${a} ${b}L${c} ${d}" stroke="var(--accent)" stroke-width="1.5" fill="none" marker-end="url(#xor-arrow)"/>`;
  let edges = "",
    nodes = "";
  if (multi) {
    data.hidden.forEach((n, j) => {
      const y = 20 + j * 150;
      edges +=
        edge(200, 200, 310, y + 66) +
        edge(200, 410, 310, y + 66) +
        edge(520, y + 66, 650, 310);
      nodes += card(n.name, n.weights, n.bias, n.sum, n.value, 310, y, "tanh");
    });
    nodes += card(
      "y",
      data.output.weights,
      data.output.bias,
      data.output.sum,
      data.output.value,
      650,
      210,
      "Sigmoid",
    );
  } else {
    edges = edge(200, 200, 520, 290) + edge(200, 410, 520, 290);
    nodes = card(
      "y",
      data.output.weights,
      data.output.bias,
      data.output.sum,
      data.output.value,
      520,
      210,
      "Sigmoid",
    );
  }
  return `<p>更新${epoch}回の重みを表示中。選択入力：(x₁,x₂) = (${x},${y})</p><div class="xor-network-scroll" tabindex="0" role="group" aria-label="入力層から出力層へのネットワーク図。横スクロール可能"><div class="xor-network-diagram"><svg width="900" height="640" aria-hidden="true"><defs><marker id="xor-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="var(--accent)"/></marker></defs>${edges}</svg><section class="xor-node xor-input" style="left:10px;top:165px"><h3>入力 x₁ = ${x}</h3><p>データとして与える値</p></section><section class="xor-node xor-input" style="left:10px;top:375px"><h3>入力 x₂ = ${y}</h3><p>データとして与える値</p></section>${nodes}</div></div><p>各ノードの w は入ってくる信号の重み、b はバイアスです。重み付き和に活性化関数を適用して出力を作ります。入力ノードは学習パラメータを持ちません。数値は小数第3位に丸めています。狭い画面では図を横にスクロールできます。</p>`;
}
