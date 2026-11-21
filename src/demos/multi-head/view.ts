import { mountExploration } from "../llm-common/exploration";
import { probabilityBars } from "../llm-common/view";
import { compareHeads, inputs, labels, type Axis } from "./model";

export function mountMultiHead(root: HTMLElement) {
  let queryIndex = 2, secondAxis: Axis = 1;
  const controller = new AbortController();
  const layout = mountExploration(root, "multi-head", "「読む」がどの語から多く情報を受け取るか、二つのヘッドで比べます。ヘッド2の変換をヘッド1と同じにするとどうなるでしょうか。", {
    reset: () => { queryIndex = 2; secondAxis = 1; render(); }
  });
  layout.body.innerHTML = `<section><h2>同じ入力を二つのヘッドへ</h2>
    <div class="llm-tokens">${inputs.map((x,i)=>`<span class="llm-token">${labels[i]}　(${x.join(", ")})</span>`).join("")}</div>
    <div class="llm-grid"><label>情報を集める語 <select data-query>${labels.map((word,i)=>`<option value="${i}">${word}</option>`).join("")}</select></label>
    <label>ヘッド2の変換 <select data-axis><option value="1">第2成分を使う</option><option value="0">第1成分を使う（ヘッド1と同じ）</option></select></label></div></section>
    <div class="llm-grid" data-heads></div>
    <section><h2>二つの結果をつなぐ</h2><p class="llm-output" data-join></p>
    <p>左の2成分はヘッド1、右の2成分はヘッド2から来ています。Transformerは、つないだ結果をさらに線形変換します。</p></section>
    <details><summary>重みと出力の計算を見る</summary><p>選んだ語のQueryと各語のKeyに同じ変換を使います。内積を√2で割り、Softmaxで合計1の重みにします。各語のValueにこの重みを掛けて足したものが、各ヘッドの出力です。ここではValueは両ヘッドとも元の入力と同じです。</p><div data-math></div></details>
    <p>入力と変換は、違いが見えるように選んだ教材用の値です。実際のモデルでは、各ヘッドの変換を学習します。</p>`;
  const query = layout.body.querySelector<HTMLSelectElement>("[data-query]")!;
  const axis = layout.body.querySelector<HTMLSelectElement>("[data-axis]")!;
  const numbers = (v: readonly number[]) => `(${v.map(n=>n.toFixed(2)).join(", ")})`;
  function render() {
    query.value = String(queryIndex); axis.value = String(secondAxis);
    const { first, second, joined } = compareHeads(queryIndex,secondAxis);
    const heads = [first,second];
    layout.body.querySelector("[data-heads]")!.innerHTML = heads.map((h,i)=>`<section class="llm-panel"><h2>ヘッド ${i+1}</h2>
      <p>第${h.axis+1}成分を使って注目先を決める</p><h3>「${labels[queryIndex]}」から各語への重み</h3>
      ${probabilityBars(labels,h.weights,"重み")}<p>集めた情報　<strong>${numbers(h.output)}</strong></p></section>`).join("");
    layout.body.querySelector("[data-join]")!.textContent = numbers(joined);
    layout.body.querySelector("[data-math]")!.innerHTML = heads.map((h,i)=>`<p>ヘッド${i+1}：Query = (${h.query.join(", ")})、Key（太郎・花子・読むの順）= ${h.keys.map(k=>`(${k.join(", ")})`).join("、")}。内積 ÷ √2 = ${numbers(h.scores)}。</p>`).join("");
    layout.status.textContent = secondAxis === 0 ? "二つのヘッドで同じ変換を選んだため、各語への重みと出力が一致しました。"
      : `「${labels[queryIndex]}」が同じ3語から情報を集めました。ヘッドごとに異なる成分から重みを計算しています。`;
  }
  query.addEventListener("change",()=>{queryIndex=Number(query.value);render();},{signal:controller.signal});
  axis.addEventListener("change",()=>{secondAxis=axis.value==="1"?1:0;render();},{signal:controller.signal});
  render();
  return () => { controller.abort(); layout.dispose(); };
}
