import {
  session06Demos,
  session06Path,
  session06Summary,
  session06Title,
} from "./session06";
export function renderSession06(): string {
  return `<a class="back" href="#/">← 授業一覧</a><a class="back" href="#/sessions/08">第8回 · 生成AI・LLMへ →</a><div class="page-heading"><p class="eyebrow">Information Science A / Session 06</p><h1>${session06Title}</h1><p class="lead">まず4つの入力を分類して、ニューロンを組み合わせる意味を探ろう。</p></div><p class="goal">ニューラルネットワークの歴史（1–2） → 探索（3–6） → 知識・推論（7–9） → 対話（10）</p><div class="section-heading"><h2>インタラクティブ・デモ</h2><span>${session06Summary}</span></div><p>前半では重みや移動先を変えて結果を予想し、後半ではコンピュータが結論や返答を作る手順を追います。各カードから始められます。</p><div class="card-grid">${session06Demos.map((d, i) => `<a class="card ${d.ready ? "available" : ""}" href="${session06Path}/${d.slug}"><div class="card-top"><span class="demo-icon" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><span class="badge">${d.ready ? "体験できます" : "準備中"}</span></div><h2>${d.title}</h2><p>${d.description}</p><p class="session04-keywords">学習キーワード：${d.keywords}</p><span class="card-link">${d.ready ? "デモを開く" : "内容を見る"} <span aria-hidden="true">↗</span></span></a>`).join("")}</div>`;
}
