# n-gram追加の動作確認（2026-11-23）

対象：`#/sessions/08/ngram`（JS13）および既存12教材。

- `npm ci`：成功（依存追加・lockfile変更なし）。
- `npm run typecheck`：成功。
- `npm run test`：38ファイル・672件成功。新規モデルテスト21件。
- `npm run build`：成功。既存の大きなチャンク警告あり。
- `git diff --check`：成功。
- 独立コードレビュー：修正が必要な指摘なし。
- Chrome 157.0.8103.79 / macOS / Playwright headless：操作検証成功、pageerrorなし。
- n-gram全4タブを390px幅、全13教材を1280/768/390px幅で確認。
- 生成操作の結果付近への配置と、初期化後のフォーカス保持を確認。
- 結果：[n-gramの詳細](ngram-results.json)、[第8回の回帰確認](session08-results.json)。

## 再実行

Playwrightは外部の既存ランタイムを使用し、このプロジェクトの依存には追加していない。Chromeがインストールされた環境で実行する。`PLAYWRIGHT_PACKAGE`にはPlaywrightのpackage.jsonの絶対パスを設定する。

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4186
```

別のターミナルで：

```sh
export PLAYWRIGHT_PACKAGE=/absolute/path/to/playwright/package.json
export DEMO_BASE=http://127.0.0.1:4186/information-science-interactive-lab/
node scripts/check_ngram_browser.mjs
node scripts/check_session08_browser.mjs
```

既定の出力先はそれぞれ `/tmp/ngram-browser-check` と `/tmp/session08-browser-check`。`QA_OUTPUT`で変更できる。JSONとスクリーンショットを出力する。

## 確認範囲

文境界・n=1の空文脈・EOSとの文字列衝突・確率和・抽選境界・同率最大確率・不変更新・30単語停止はモデルテストで確認。UIでは編集と再学習、終了時のボタン状態、リセット、回答、キーボード、長すぎる開始文、HTMLの安全な表示も確認した。

GitHub Pagesと同じサブパスのローカル本番ビルドを検証した。今回は公開していないため公開環境は未確認。Safari・スマホ実機は未確認。非表示停止はdocument.hiddenとvisibilitychangeを模擬したテストであり、実際のOSでのタブ切替テストとは区別する。
