import { mountDemoLayout } from "../components/demoLayout";
import {
  session07Materials,
  session07Summary,
  session07JSReady,
  session07NotebookReady,
  session07Title,
  session07Path,
  session07Config,
  type LearningMaterial,
} from "./session07";
const card = (m: LearningMaterial) =>
  `<a class="card ${m.ready ? "available" : ""}" href="${session07Path}/${m.slug}"><div class="card-top"><span class="demo-icon">${m.code}</span><span class="badge">${m.ready ? "体験できます" : "準備中"}</span></div><h3>${m.title}</h3><p>対応スライド：${m.slides}</p><p>${m.goal}</p><span class="card-link">${m.ready ? (m.kind === "notebook" ? "Notebookを開く" : "デモを開く") : "内容を見る"} →</span></a>`;
export function renderSession07() {
  return `<a class="back" href="#/">← 授業一覧</a><a class="back" href="#/sessions/08">第8回 · 生成AI・LLMへ →</a><div class="page-heading"><p class="eyebrow">Information Science A / Session 07 · 2026年11月16日</p><h1>${session07Title}</h1><p class="lead">機械学習では何を学ぶ？<br>学んだモデルは、初めてのデータにも使える？</p></div><p class="goal">データ → 学習アルゴリズム → モデル → 予測 → 評価</p><section class="lesson-panel"><h2>教材の使い方</h2><p>ブラウザで仕組みを動かして調べるJavaScriptデモと、Pythonライブラリで実験するNotebookを用意します。操作する前に予想し、結果から何が分かるか考えてみましょう。</p><p>現在は${session07Summary}です。各ページでは学習目的と対応スライドを確認できます。</p><p>JavaScriptはインストール不要。NotebookはJupyterまたはGoogle Colabを使います。各Notebookページに実行手順・必要なライブラリと実行済みファイルへのリンクがあります。</p></section><section><div class="section-heading"><h2>JavaScript：仕組みを動かして学ぶ</h2><span>${session07JSReady}本利用可能</span></div><div class="card-grid">${session07Materials
    .filter((m) => m.kind === "javascript")
    .map(card)
    .join(
      "",
    )}</div></section><section><div class="section-heading"><h2>Python Notebook：データで実験する</h2><span>${session07NotebookReady}本利用可能</span></div><div class="card-grid">${session07Materials
    .filter((m) => m.kind === "notebook")
    .map(card)
    .join("")}</div></section>`;
}
export function mountMaterial07(root: HTMLElement, m: LearningMaterial) {
  const l = mountDemoLayout(root, m, {}, session07Config);
  l.instructions.textContent =
    m.kind === "javascript"
      ? "準備中です。実装後は、図と操作パネルで学習の過程を調べられます。"
      : "準備中です。Notebook本体と実行結果の検証後に、ダウンロードとColabのリンクを掲載します。";
  l.body.classList.add("session07-body");
  l.body.innerHTML = `<p class="badge">${m.code} · ${m.kind === "javascript" ? "JavaScript" : "Python Notebook"} · 準備中</p><p>対応スライド：${m.slides}</p><section class="lesson-panel"><h2>可視化・実験エリア</h2><p>この教材の実装後に、データと結果を表示します。</p>${m.filename ? `<p>作成予定：<code>${m.filename}</code></p>` : ""}</section><section class="lesson-panel"><h2>考えてみよう</h2><p>${m.question}</p></section>`;
  l.status.textContent =
    "この教材は準備中です。現在は計算・学習・Notebookの実行はできません。";
  return l.dispose;
}

const notebookRoot =
  "https://github.com/m-riho/information-science-interactive-lab/blob/main/public/notebooks/session07/";
export function notebookLinks(filename: string) {
  return {
    download: import.meta.env.BASE_URL + "notebooks/session07/" + filename,
    github: notebookRoot + filename,
    colab:
      "https://colab.research.google.com/github/m-riho/information-science-interactive-lab/blob/main/public/notebooks/session07/" +
      filename,
  };
}
export function mountNotebook07(root: HTMLElement, m: LearningMaterial) {
  if (!m.filename) throw new Error("Notebookのファイル名がありません");
  const l = mountDemoLayout(root, m, {}, session07Config);
  const links = notebookLinks(m.filename),
    base = import.meta.env.BASE_URL + "notebooks/session07/";
  l.instructions.textContent =
    "実行済みNotebookをダウンロードしてJupyterで開くか、Colabで開きます。コードを読む前に、日本語の説明と保存済みのグラフから結果を確認できます。";
  l.body.classList.add("session07-body");
  root.querySelector<HTMLElement>('[data-slot="controls"]')!.hidden = true;
  l.body.innerHTML =
    '<p class="badge">' +
    m.code +
    " · Python Notebook</p><p>対応スライド：" +
    m.slides +
    '</p><section class="lesson-panel"><h2>Notebookを使う</h2><div class="notebook-links"><a download href="' +
    links.download +
    '">実行済みNotebookをダウンロード</a><a href="' +
    links.github +
    '">GitHubで読む</a><a href="' +
    links.colab +
    '">Google Colabで開く</a></div><p>GitHubでは保存済みの出力を閲覧でき、Colabではコピーして実験できます。</p><p>ローカルではPython 3.12以降を想定しています。作者の保存済み出力はPython 3.13.5で実行し、GPU計測はCPUとMPS、他のNotebookはCPUで検証しました。CUDA実機とColabでの実行は未検証です。</p><p><a download href="' +
    base +
    'requirements.txt">検証したライブラリ一覧</a> ／ <a href="' +
    base +
    'README.md">準備と実行の手順</a></p><p>Jupyterは「カーネル → 再起動してすべて実行」、Colabは「ランタイム → すべてのセルを実行」を選びます。標準環境と版が違うときは、Notebook冒頭の手順を参照してください。</p></section>' +
    (m.code === "NB04"
      ? '<section class="lesson-panel"><h2>画像と学習済み重み</h2><p>初回は約45MBの学習済み重みをダウンロードします。入力画像はNASA撮影・Public Domainです。必要なら同じフォルダのassetsへ配置できます。</p><div class="notebook-links"><a download href="' +
        base +
        'assets/astronaut.png">入力画像をダウンロード</a><a href="' +
        base +
        'assets/LICENSE.md">画像の出典とライセンス</a></div><p>未接続で必要な画像やキャッシュがない場合は、推論をスキップして理由を表示します。</p></section>'
      : "") +
    '<section class="lesson-panel"><h2>考えてみよう</h2><p>' +
    m.question +
    "</p></section>";
  l.status.textContent =
    "実行済みの結果を保存しています。グラフと日本語の説明を確認し、条件を変えて再実行してください。";
  return l.dispose;
}
