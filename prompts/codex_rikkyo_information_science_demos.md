# Codexへの開発指示：立教大学「情報科学A」インタラクティブ教材

## 目的
立教大学の全カリ「情報科学A」（文系学生、高校「情報I」未履修者を含む）向けに、日本語のブラウザ教材サイトを新規制作する。参考サイトは `https://m-riho.github.io/computer-graphics-demos/#/sessions/02`。カード型の授業回一覧→個別デモという操作導線を参考にするが、デザインやソースをコピーしない。Git管理しGitHub Pagesで学生に公開できる構成にする。今回の対象は第3回「コンピュータの仕組み」の7デモ。将来、他の授業回を増やせる設計にする。

## 技術・構成
- Vite + TypeScript（strict）+ p5.js（Canvas描画、instance mode）。UIはHTML/CSS/TypeScriptを基本とし依存関係は最小限。数値計算と描画を分離する。
- `npm run dev`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run preview` を用意。Node.js LTS、npm、package-lock.jsonを使用。
- GitHub Pagesのプロジェクトサイト `https://<USER>.github.io/<REPO>/` に対応。Viteの `base` は公開時 `/<REPO>/`、開発時 `/`。GitHubユーザー名・リポジトリ名は仮の値を設定しREADMEで変更方法を説明。
- URLはHash Routerを使用：`#/`, `#/sessions/03`, `#/sessions/03/wheel-aliasing` など。直接リンク、更新、戻る/進むに対応。
- `.github/workflows/deploy.yml` を作り、mainへのpushで `npm ci → typecheck → test → build → GitHub Pagesデプロイ`。GitHub公式のconfigure-pages、upload-pages-artifact、deploy-pagesを使用し、`contents: read`, `pages: write`, `id-token: write` を指定。公開設定はSettings→Pages→GitHub Actions。実際の公開・リモート設定・pushはユーザーの許可があるまで行わない。
- `AGENTS.md` は日本語で作り、設計原則・型安全・テスト・コミット方針・UI原則を記載。`.gitignore` にnode_modules、dist、環境変数等を指定。APIキー・サーバー・ログイン・利用者追跡は不要。
- 推奨構造：`src/main.ts`, `src/styles/theme.css`, `src/components/`, `src/sessions/`, `src/demos/<slug>/`, `src/utils/`, `tests/`, `public/`, `.github/workflows/deploy.yml`, `README.md`, `AGENTS.md`。ルート遷移時に描画ループとイベントを適切に破棄する。

## 色とUI
立教学院のスクールカラーは**紫紺（DIC 226）**。これは公式の印刷色指定であり、下記HEXは**Web用の仮色**であって公式RGB値ではない。後からCSS変数で差し替えられるようにする。

```css
:root {
  --brand: #4B286D;
  --brand-dark: #32184C;
  --brand-light: #F2ECF7;
  --accent: #8060A8;
  --surface: #FFFFFF;
  --text: #22212A;
  --border: #DDD4E6;
}
```

公式ロゴ・校章・シンボルは使用せず、大学名と授業名の文字表記に留める。見やすいコントラスト、色以外の情報表現、キーボード操作、タッチ操作、16:9投影、スマホ対応、全画面表示、動きを減らす設定を実装。トップ→第3回→7つのデモカード。各デモ共通：学習目標、操作説明、スライダーと現在値、開始/停止、リセット、観察ポイント、なぜそうなるか、一覧へ戻る。専門用語を日本語で簡潔に説明する。数式は任意で展開できるようにする。

## 実装する7つのデモ

### 1. 回転円盤とフレームレート `wheel-aliasing` 【最優先】
時間方向の標本化とエイリアシングを理解する。左は基準となる滑らかな回転、右は指定fpsでサンプルしたカメラ映像。円盤には方向が分かる非対称マークを付ける。回転速度（符号付きrps）、fps（1〜60）、再生速度、停止、コマ送りを操作。正回転・静止に見える・逆回転に見えるプリセットを用意。実際の回転数と見かけの回転数を表示。**回転の見かけの周波数は、マークが1回転ごとに同じ姿へ戻るモデルの折り返し周波数として算出**し、境界での曖昧さに注記。requestAnimationFrameの描画頻度と模擬撮影fpsは別管理。実機の画面更新にも限界があると注記。

### 2. 空間サンプリングとモアレ `spatial-sampling`
左は縞・格子・斜線・同心円の基準画像、右は低解像度標本化した画像。縞の細かさ・位相・格子解像度（16〜256）・表示補間（最近傍/線形）・標本化前ローパスのON/OFFを操作。**標本化前の低域通過フィルタと表示時の補間は異なる**と明示。モアレ・ジャギー・ぼけを区別。基準画像は解析式または十分高い内部解像度で作る。

### 3. ローリングシャッター `rolling-shutter`
左に実際のプロペラ、右に撮影結果。Global/Rolling切替、回転速度、fps、1フレームの読み出し時間、露光時間、走査方向を操作。行ごとの時刻を `t_row=t_frame+(row/height)*readoutTime` でモデル化。Globalは全行同時刻。必要なら露光時間内の複数時刻を平均しブラーを近似。**フレーム間のエイリアシングと1フレーム内のローリング歪みを混同しない**。

### 4. メモリ階層とキャッシュ `memory-hierarchy`
CPU、レジスタ、キャッシュ、RAM、SSDを可視化。CPUのアクセス要求をアニメーション表示。キャッシュ容量、アクセスパターン（順次・繰り返し・ランダム）、再生速度を操作。ヒット率、ミス数、総待ち時間を表示。待ち時間は「教育用の仮想値」と明記し、実測値と混同しない。キャッシュ置換はLRUなど一方式を明示。局所性を理解できる例を用意。

### 5. ムーアの法則 `moores-law`
年とトランジスタ数のグラフを通常軸/対数軸で切替。倍増期間12/18/24か月のモデルを比較。教材の代表値：Intel 4004（1971、約2300）、80386（1985、約229000）、初期Core i7（2008、約3.8億）、Apple M2 Ultra（2023、約1340億）。**CPUとSoCを混在させた概観で厳密な同条件比較ではない**と注記。1965年の約1年で倍増という観察、1975年の約2年への見直し、通俗的な18か月説を区別。トランジスタ数＝処理性能としない。データと出典を別ファイルに整理。

### 6. 論理ゲート・プレイグラウンド `logic-gates`
入力A/Bの0/1スイッチ、AND/OR/NOT/NAND/XOR選択、出力ランプと真理値表を同期。NOTはAのみ使用。直列スイッチ→AND、並列スイッチ→ORの概念図を用意。さらに**NANDのみでNOT、AND、ORを組む**段階的なモードを実装。配線と中間出力を表示。論理関数を単体テストする。

### 7. 半加算器と4bit加算器 `binary-adder`
A/Bの1bit入力でSUM=XOR、CARRY=ANDを可視化し、`1+1=10₂` を表示。4bitモードでは各桁の全加算器と繰り上がり伝播をアニメーション表示。4bit+4bitの結果は**5bit**で表示し、十進数も併記。半加算器と全加算器の違いを説明。0〜15の全組合せ（256通り）で計算結果を自動テストする。

## 教材の質とテスト
- 各デモに「予想→操作→説明」の問いを2〜3個設ける。初学者向けで、説明は短く正確に。
- Canvas/SVGで図を自作し、著作権不明な画像や参考サイトの素材を流用しない。
- Safari/Chrome/Firefoxの現行版で動作し、スマホでも主要操作が可能。非表示タブでアニメーションを停止。低性能端末では描画負荷を下げる。
- `npm ci && npm run typecheck && npm run test && npm run build` を通す。
- 7デモへのリンク、URL直打ち、リロード、戻る、リセット、キーボード操作を確認。
- エイリアシングの静止/逆回転、モアレのローパスON/OFF、Global/Rollingの差、キャッシュ既知アクセス列、論理ゲート真理値表、加算256通り、通常軸/対数軸の切替を確認。
- READMEにローカル起動、GitHubリポジトリ作成、GitHub Pages設定、公開URL、デモ追加方法、ライセンスと素材の扱い、既知の制約を書く。GitHub Pagesは静的公開であり学生の成績や操作履歴を収集しない。

## 開発の進め方（重要）
1. **フェーズ1**：Vite/TypeScript、Git構成、AGENTS.md、共通UI、セッション一覧、テーマ、GitHub Pages workflowを作る。まずダミーのデモカード7件を表示。
2. **フェーズ2**：デモ1「回転円盤とFPS」を完全実装。数学的な挙動をテストし、ローカルで操作を確認。ここでUI・コード規約を固める。
3. **フェーズ3**：デモ2と3（標本化・ローリングシャッター）を実装。
4. **フェーズ4**：デモ6と7（論理ゲート・加算器）を実装。
5. **フェーズ5**：デモ4と5（メモリ・ムーアの法則）を実装。
6. **フェーズ6**：全体のアクセシビリティ、スマホ、テスト、README、デプロイ確認。

**最初のCodex実行ではフェーズ1とフェーズ2だけを進め、完了したファイル、動作確認結果、残作業を日本語で報告して一度停止すること。** 勝手にGitHubリポジトリを作成したり、push・公開したりしない。実装上の判断はAGENTS.md/READMEに残す。

## Codexへの最初の入力例
> このリポジトリにある `codex_rikkyo_information_science_demos.md` を仕様書として読み、フェーズ1とフェーズ2を実装してください。Vite+TypeScript+p5.jsを用い、紫紺を基調とした授業サイト、Hash Router、GitHub Pages対応、7デモの一覧、回転円盤/FPSデモを完成させてください。AGENTS.mdとREADME.mdも日本語で作成し、型チェック・テスト・ビルドを実行して結果を報告してください。GitHubへのpushと公開はまだ行わないでください。

## 参考情報
- 参考UI：`https://m-riho.github.io/computer-graphics-demos/#/sessions/02`
- 立教学院デザインガイド：`https://rec.rikkyo.ac.jp/designguide/`（公式色：紫紺 DIC 226。ロゴ利用規定あり）
- Vite GitHub Pages：`https://vite.dev/guide/static-deploy`
- GitHub Pages公式：`https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages`
