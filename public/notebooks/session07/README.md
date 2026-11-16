# 情報科学A 第7回 Python実験
日本語の説明と実行済み出力を付けた4本です。上から順に「すべて実行」できます。計算結果は版・計算機で多少変わります。

| ファイル | 内容 | 通信 |
| --- | --- | --- |
| 01_digits_kmeans.ipynb | 1797数字、標準化、k-means、PCA | 不要 |
| 02_digits_mlp.ipynb | 64→16→8→10のReLU MLP、評価、中間層 | 不要 |
| 03_pytorch_gpu.ipynb | CPU / CUDA / MPS行列積、同期と転送 | 不要 |
| 04_image_classification.ipynb | ResNet18とNASA画像、上位5クラス | 初回の重み取得。画像未配置時も通信 |

## ローカル
Python 3.12以降を想定。実行検証はPython 3.13.5。
4本・requirements.txt・画像のassetsフォルダを同じフォルダへ保存します。新しい仮想環境を作り、そのPythonで次を実行してください。

    python -m pip install -r requirements.txt
    python -m ipykernel install --user --name information-science-a07

Jupyter（NotebookやJupyterLab、VS Codeなど）でこのカーネルを選びます。Jupyter自体を未導入なら別途インストールしてください。
Notebook 04は単体でも画像を公式配布元から取得できます。モデル重み約45MBはPyTorchキャッシュへ初回ダウンロードします。オフラインでは事前にオンラインで一度実行し、画像と重みのキャッシュを用意します。未学習重みで代用しません。

## Colab
各Notebookのリンクから開き「ランタイム → すべてのセルを実行」を選びます。リンクはこのリポジトリへの反映後に有効です。
標準ライブラリで動く場合はそのまま試せます。作者と版をそろえる場合は、必要なパッケージをrequirements.txtからインストールしてランタイムを再起動します。
CPUを選んでも4本とも動きます。CPU / MPSで検証済み、CUDAとColab実機は未検証です。

## 再実行と保存出力
リポジトリのscripts/build_session07_notebooks.pyは未実行Notebookの再生成用です。実行済み出力が消えるので、通常の再実行はscripts/execute_session07_notebooks.pyを使います。
Notebookのコードセル内には数値・形状の検証を含めています。03は環境変数A07_FORCE_CPU=1でCPUだけの分岐を検証できます。
MLPの500エポック到達時の収束警告は出力に残しています。テスト結果を見ながら同じテスト集合向けに調整し続けないでください。

GPU時間は実測の中央値であり、GPUが常に高速という意味ではありません。03は同じfloat32行列・ウォームアップ2回・本計測7回・CPU 2スレッドです。
実行結果の確認記録：execution-report.json、cpu-fallback-report.json。

## 権利
Digits：UCI Optical Recognition of Handwritten Digits、CC BY 4.0。
https://doi.org/10.24432/C50P49
画像：NASA撮影のEileen Collins、Public Domain。詳しくはassets/LICENSE.md。
モデル重みはtorchvision公式から取得し、このフォルダには同梱しません。
