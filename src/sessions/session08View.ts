import { session08Demos, session08Path, session08Title } from "./session08";
export function renderSession08(): string {
  return `<a class="back" href="#/">← 授業一覧</a>
    <div class="page-heading"><p class="eyebrow">Information Science A / Session 08</p><h1>${session08Title}</h1><p class="lead">大規模言語モデルの仕組みと、その能力・限界</p></div>
    <p class="goal">文章を数値へ → 次のトークンを予測 → 文脈の情報を合成 → 回答の根拠を確認</p>
    <p>復習用の2本では、数値ベクトルと学習例の作り方を確かめられます。まず結果を予想してから操作してみましょう。</p>
    <div class="section-heading"><h2>インタラクティブ・デモ</h2><span>${session08Demos.length}本利用可能</span></div>
    <div class="card-grid">${session08Demos.map(demo => `<a class="card available" href="${session08Path}/${demo.slug}"><div class="card-top"><span class="demo-icon">${demo.code}</span><span class="badge">${demo.usage}</span></div><h2>${demo.title}</h2><p>対応スライド ${demo.slides}</p><p>${demo.goal}</p><span class="card-link">デモを開く →</span></a>`).join("")}</div>
    <nav class="demo-navigation" aria-label="関連する授業"><a href="#/sessions/06">第6回 · 古典的AI</a><a href="#/sessions/07">第7回 · 機械学習・深層学習</a><a href="#/">授業一覧</a></nav>`;
}
