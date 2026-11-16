"""Generate the four Japanese teaching notebooks; execution is a separate step."""
from pathlib import Path
import nbformat as nbf
BASE = Path(__file__).resolve().parents[1] / "public/notebooks/session07"
BASE.mkdir(parents=True, exist_ok=True)
REPO = "https://github.com/m-riho/information-science-interactive-lab/blob/main/public/notebooks/session07/"
COMMON = """Python 3.12以降を想定し、作者の実行検証はPython 3.13.5で行います。
依存ライブラリは同じフォルダのrequirements.txtを参照してください。
ローカルでは新しい仮想環境で `python -m pip install -r requirements.txt` を実行します。
Colabではランタイム標準ライブラリでも試せますが、版の違いで結果は変わる場合があります。必要ならrequirements.txtに合わせてインストールし、ランタイムを再起動してください。
実行は「ランタイム／カーネル → すべて実行」。保存済みの出力は作者の実測例です。"""

def notebook(filename, title, goal, libs):
    nb=nbf.v4.new_notebook()
    nb.metadata.update(kernelspec={"display_name":"Python 3","language":"python","name":"python3"}, language_info={"name":"python","version":"3.13.5"})
    nb.cells=[nbf.v4.new_markdown_cell(f"# {title}\n\n{goal}\n\n必要なライブラリ：{libs}\n\n[Google Colabで開く](https://colab.research.google.com/github/m-riho/information-science-interactive-lab/blob/main/public/notebooks/session07/{filename})\n\nColabリンクは、このファイルを既存の公開リポジトリへ反映した後に利用できます。\n\n{COMMON}")]
    return nb

def step(nb,title,before,code,after):
    nb.cells.extend([nbf.v4.new_markdown_cell(f"## {title}\n\n{before}"),nbf.v4.new_code_cell(code.strip()),nbf.v4.new_markdown_cell(after)])
def save(nb,name,refs,summary):
    nb.cells.append(nbf.v4.new_markdown_cell(f"## まとめ\n\n{summary}\n\n## 参考資料\n\n"+refs))
    nbf.write(nb,BASE/name)

nb=notebook("01_digits_kmeans.ipynb","01 手書き数字のクラスタリング","正解ラベルを渡さずに群を作り、クラスタ番号と数字の正解が異なることを確かめます。","NumPy、Matplotlib、scikit-learn")
step(nb,"実験の概要と準備","Digitsは1797枚・8×8画素＝64特徴量です。スライド17の改訂補足に合わせ、標準化あり、k=10、random_state=7、n_init=10で実験します。",
"""
import sys
import numpy as np
import matplotlib.pyplot as plt
import sklearn
from sklearn.datasets import load_digits
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import adjusted_rand_score
from threadpoolctl import threadpool_limits
np.random.seed(7)
print("Python:", sys.version.split()[0], "NumPy:", np.__version__,
      "Matplotlib:", plt.matplotlib.__version__, "scikit-learn:", sklearn.__version__)
digits = load_digits()
X, y = digits.data, digits.target
assert X.shape == (1797, 64)
fig, axes = plt.subplots(2, 5, figsize=(8, 3))
for i, ax in enumerate(axes.flat):
    ax.imshow(digits.images[i], cmap="gray_r")
    ax.set_title(f"label={y[i]}")
    ax.axis("off")
plt.tight_layout()
plt.show()
""","数字の濃淡が64個の数値です。ここで表示した正解ラベルは観察用で、次の学習には渡しません。データはscikit-learn同梱なので外部通信は不要です。")
step(nb,"標準化してk-means","各画素の平均・標準偏差を使って特徴量を標準化します。学習後にクラスタと正解数字の対応を表にします。",
"""
scaler = StandardScaler()
Xs = scaler.fit_transform(X)
with threadpool_limits(limits=1):
    km = KMeans(n_clusters=10, random_state=7, n_init=10).fit(Xs)
cluster = km.labels_
counts = np.zeros((10, 10), dtype=int)
np.add.at(counts, (cluster, y), 1)
assert counts.sum() == 1797
fig, ax = plt.subplots(figsize=(8, 5))
im = ax.imshow(counts, cmap="Purples")
ax.set(xlabel="True digit", ylabel="Cluster ID", xticks=range(10), yticks=range(10))
for i in range(10):
    for j in range(10):
        ax.text(j, i, str(counts[i, j]), ha="center", va="center",
                color="white" if counts[i,j] > counts.max()/2 else "black", fontsize=8)
fig.colorbar(im, ax=ax, label="Count")
plt.tight_layout()
plt.show()
print("ARI（クラスタ番号の入替えに依存しない比較）:", round(adjusted_rand_score(y, cluster), 4))
""","行はクラスタ番号、列は正解数字です。クラスタ0が数字0を意味するわけではありません。ラベルはこの比較だけに使いました。標準化は明るさの小さな違いの重み付けにも影響します。")
step(nb,"クラスタ内の数字とPCA表示","各群から最初の8枚を見ます。さらにPCAで64次元を2次元に縮約して配置します。PCAは表示用で、k-meansは64次元の標準化データに対して実行済みです。",
"""
fig, axes = plt.subplots(10, 8, figsize=(10, 10))
for c in range(10):
    ids = np.flatnonzero(cluster == c)[:8]
    for j in range(8):
        ax = axes[c,j]
        if j < len(ids):
            ax.imshow(digits.images[ids[j]], cmap="gray_r")
            ax.set_title(f"C{c}: {y[ids[j]]}", fontsize=8)
        ax.axis("off")
plt.tight_layout()
plt.show()
with threadpool_limits(limits=1):
    pca = PCA(n_components=2, svd_solver="full")
    xy = pca.fit_transform(Xs)
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
for values, ax, title in [(cluster, axes[0], "Clusters"), (y, axes[1], "True labels (after clustering)")]:
    im = ax.scatter(xy[:,0], xy[:,1], c=values, cmap="tab10", s=8, vmin=-.5, vmax=9.5)
    ax.set(title=title, xlabel="PC1", ylabel="PC2")
    fig.colorbar(im, ax=ax, ticks=range(10))
plt.tight_layout()
plt.show()
print("PCA 2成分の説明分散比合計:", round(pca.explained_variance_ratio_.sum(), 3))
""","同じクラスタに違う数字が混じる場合や、同じ数字が複数クラスタに分かれる場合があります。2次元で重なる点が元の64次元でも同じとは限りません。")
step(nb,"条件を変える実験","kを8・10・12、乱数シードを7・19に変えます。標準化は固定し、変更の影響を比較します。",
"""
results = []
with threadpool_limits(limits=1):
    for k in [8,10,12]:
        for seed in [7,19]:
            model = KMeans(n_clusters=k, n_init=10, random_state=seed).fit(Xs)
            results.append((k, seed, adjusted_rand_score(y, model.labels_)))
print("k, seed, ARI")
for k, seed, ari in results:
    print(k, seed, f"{ari:.4f}")
""","どのkが正しいかは用途にもよります。数字が10種類だから必ず10群にきれいに分かれるわけではありません。初期値による違いが小さくなるのはn_init=10の効果もあります。")
save(nb,"01_digits_kmeans.ipynb","- [scikit-learn Digits k-means例](https://scikit-learn.org/stable/auto_examples/cluster/plot_kmeans_digits.html)\n- [UCI Optical Recognition of Handwritten Digits（CC BY 4.0）](https://doi.org/10.24432/C50P49)","正解を使わずに群を作る方法と、作った群を後から評価する手順を区別できました。")

nb=notebook("02_digits_mlp.ipynb","02 手書き数字のニューラルネットワーク","学習・予測・評価を行い、中間層の応答を公開された重みから計算します。","NumPy、Matplotlib、scikit-learn")
step(nb,"データと実験条件","スライド表示51（PPTX内49枚目）の実験に合わせ、64→16→8→10、ReLU、seed7、stratifyありの75％／25％分割、入力を16で割る条件です。講義資料作成コードと同じmax_iter=500を使います。",
"""
import sys
import warnings
import numpy as np
import matplotlib.pyplot as plt
import sklearn
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, ConfusionMatrixDisplay
from sklearn.exceptions import ConvergenceWarning
from threadpoolctl import threadpool_limits
np.random.seed(7)
digits = load_digits()
X, y = digits.data / 16.0, digits.target
train_ids, test_ids = train_test_split(np.arange(len(y)), test_size=.25, stratify=y, random_state=7)
print("訓練:", len(train_ids), "テスト:", len(test_ids), "（分割後は重複なし）")
assert set(train_ids).isdisjoint(test_ids)
print("Python:", sys.version.split()[0], "scikit-learn:", sklearn.__version__)
""","0〜16の画素値を0〜1にします。訓練集合だけで重みを学習し、テスト集合は最後の評価に使います。")
step(nb,"モデルを学習する","小型MLPを訓練します。収束の警告は記録して、無かったことにせず表示します。",
"""
with threadpool_limits(limits=1), warnings.catch_warnings(record=True) as caught:
    warnings.simplefilter("always", ConvergenceWarning)
    model = MLPClassifier(hidden_layer_sizes=(16,8), activation="relu",
                          max_iter=500, random_state=7).fit(X[train_ids], y[train_ids])
print("更新エポック:", model.n_iter_)
for message in caught:
    print(type(message.message).__name__ + ":", message.message)
assert [w.shape for w in model.coefs_] == [(64,16),(16,8),(8,10)]
plt.figure(figsize=(6,3))
plt.plot(model.loss_curve_, color="#4b286d")
plt.xlabel("Epoch"); plt.ylabel("Training loss"); plt.grid(alpha=.2)
plt.tight_layout(); plt.show()
""","損失が下がっても、未知データの正解率が必ず上がるわけではありません。上限に達した場合は収束したと断定しません。")
step(nb,"テスト集合で評価する","未学習のデータで正解率・混同行列と誤分類例を表示します。",
"""
pred = model.predict(X[test_ids])
print("訓練正解率:", round(model.score(X[train_ids], y[train_ids]), 4))
print("テスト正解率:", round(accuracy_score(y[test_ids], pred), 4))
ConfusionMatrixDisplay.from_predictions(y[test_ids], pred, cmap="Purples", colorbar=False)
plt.tight_layout(); plt.show()
wrong = np.flatnonzero(pred != y[test_ids])[:8]
fig, axes = plt.subplots(1, max(1,len(wrong)), figsize=(max(3,len(wrong)*1.5),2))
for ax in np.atleast_1d(axes): ax.axis("off")
for ax, j in zip(np.atleast_1d(axes), wrong):
    ax.imshow(digits.images[test_ids[j]], cmap="gray_r")
    ax.set_title(f"true {y[test_ids[j]]}\\npred {pred[j]}", fontsize=9)
plt.tight_layout(); plt.show()
print("表示した誤分類例:", len(wrong))
""","混同行列の行は正解、列は予測です。誤分類例はモデルの苦手な書き方を考える手掛かりですが、テスト結果を見ながら同じテスト集合向けに調整し続けると、公平な最終評価ではなくなります。")
step(nb,"中間層の応答を公開APIで再計算する","テスト集合の先頭1枚を選び、coefs_とintercepts_だけを使って、重み付き和→ReLU→重み付き和→ReLU→Softmaxを計算します。",
"""
x = X[test_ids[0:1]]
h1 = np.maximum(0, x @ model.coefs_[0] + model.intercepts_[0])
h2 = np.maximum(0, h1 @ model.coefs_[1] + model.intercepts_[1])
logits = h2 @ model.coefs_[2] + model.intercepts_[2]
exp = np.exp(logits - logits.max(axis=1, keepdims=True))
prob = exp / exp.sum(axis=1, keepdims=True)
np.testing.assert_allclose(prob, model.predict_proba(x), atol=1e-10)
assert (h1.shape, h2.shape) == ((1,16), (1,8))
fig, axes = plt.subplots(1,3, figsize=(9,3))
axes[0].imshow(x.reshape(8,8), cmap="gray_r"); axes[0].set_title("Input: 64 pixels")
axes[1].imshow(h1.reshape(4,4), cmap="Purples"); axes[1].set_title("Hidden 1: 16 responses")
axes[2].imshow(h2.reshape(2,4), cmap="Purples"); axes[2].set_title("Hidden 2: 8 responses")
for ax in axes: ax.axis("off")
plt.tight_layout(); plt.show()
print("画像の正解:", y[test_ids[0]], "予測:", model.classes_[prob.argmax()])
print("隠れ層1:", np.round(h1,3))
print("隠れ層2:", np.round(h2,3))
""","16個・8個の応答を便宜的に格子に並べました。CNNの空間的な特徴マップではありません。公開APIのpredict_probaとの一致を確認しました。")
step(nb,"条件を変える実験は訓練内で比較する","テスト集合を触らず、訓練集合の中をさらに学習・検証に分け、alpha（正則化）の違いを比較します。元のモデルと最終テスト結果は変更しません。",
"""
fit_ids, valid_ids = train_test_split(train_ids, test_size=.2, stratify=y[train_ids], random_state=19)
with threadpool_limits(limits=1):
    for alpha in [.0001, .01]:
        with warnings.catch_warnings(record=True) as records:
            warnings.simplefilter("always", ConvergenceWarning)
            trial = MLPClassifier(hidden_layer_sizes=(16,8), activation="relu",
                                  max_iter=500, alpha=alpha, random_state=7).fit(X[fit_ids], y[fit_ids])
        print("alpha", alpha, "訓練", round(trial.score(X[fit_ids], y[fit_ids]),4),
              "検証", round(trial.score(X[valid_ids], y[valid_ids]),4),
              "収束警告数", len(records))
""","検証用データは条件を選ぶため、テスト用データは最終性能を測るため、という役割を分けます。ここで最終テストを繰り返し評価しません。")
save(nb,"02_digits_mlp.ipynb","- [MLPClassifier 公開属性](https://scikit-learn.org/stable/modules/generated/sklearn.neural_network.MLPClassifier.html)\n- [scikit-learn ニューラルネットワーク](https://scikit-learn.org/stable/modules/neural_networks_supervised.html)\n- [UCI Digits（CC BY 4.0）](https://doi.org/10.24432/C50P49)","データから重みを学習し、未知の入力を分類できました。中間層も重みと活性化関数による数値変換です。")

nb=notebook("03_pytorch_gpu.ipynb","03 PyTorchによるCPU・GPU計算","同じ行列積をCPUと利用可能なGPUで測り、同期とデータ転送の影響を比べます。","PyTorch、NumPy、Matplotlib")
step(nb,"計測の概要と利用可能なデバイス","これはスライドのCPU/GPU説明に対する補足実験です。速度比の再現実験ではありません。行列積A@B、float32、ウォームアップ2回、計測7回の中央値を使います。サイズは128・512・1024です。CPUのスレッド数を2に固定します。",
"""
import sys, time, statistics, os
import numpy as np
import matplotlib.pyplot as plt
import torch
torch.manual_seed(7)
torch.set_num_threads(2)
torch.set_float32_matmul_precision("highest")
if torch.cuda.is_available():
    torch.backends.cuda.matmul.allow_tf32 = False
device = (torch.device("cpu") if os.environ.get("A07_FORCE_CPU") == "1" else torch.device("cuda") if torch.cuda.is_available()
          else torch.device("mps") if torch.backends.mps.is_available()
          else torch.device("cpu"))
print("Python:", sys.version.split()[0], "PyTorch:", torch.__version__)
print("比較先:", device, "CPU threads:", torch.get_num_threads())
if device.type == "cpu":
    print("GPUなし：CPUのみ測定します。GPUの速度は推定しません。")
def sync(d):
    if d.type == "cuda":
        torch.cuda.synchronize(d)
    elif d.type == "mps":
        torch.mps.synchronize()
def median_ms(fn, d, warmup=2, repeats=7):
    for _ in range(warmup):
        result = fn()
        sync(d)
    times = []
    for _ in range(repeats):
        sync(d)
        start = time.perf_counter()
        result = fn()
        sync(d)
        times.append((time.perf_counter() - start)*1000)
    return statistics.median(times)
""","GPUは非同期で動くため、処理前後の同期がないと、実際の計算時間を測れません。CPUしかない環境でもNotebookはそのまま最後まで実行できます。")
step(nb,"同じ入力で計算のみと転送込みを測る","CPUで作った同じ入力を全デバイスで使います。GPU用の入力を先に転送した場合と、入力転送・計算・結果のCPU転送を含む場合を分けます。",
"""
records = []
rng = torch.Generator(device="cpu").manual_seed(7)
with torch.inference_mode():
    for n in [128,512,1024]:
        a = torch.randn(n,n, generator=rng, dtype=torch.float32)
        b = torch.randn(n,n, generator=rng, dtype=torch.float32)
        reference = a @ b
        cpu_ms = median_ms(lambda: a @ b, torch.device("cpu"))
        records.append({"n":n, "device":"cpu", "compute_ms":cpu_ms, "transfer_ms":None})
        if device.type != "cpu":
            ad, bd = a.to(device), b.to(device)
            result = ad @ bd
            sync(device)
            np.testing.assert_allclose(result.cpu().numpy(), reference.numpy(), rtol=1e-3, atol=1e-3)
            compute_ms = median_ms(lambda: ad @ bd, device)
            def with_transfer():
                return (a.to(device) @ b.to(device)).to("cpu")
            transfer_ms = median_ms(with_transfer, device)
            records.append({"n":n,"device":device.type,"compute_ms":compute_ms,"transfer_ms":transfer_ms})
for row in records:
    print(row)
assert all(np.isfinite(r["compute_ms"]) and r["compute_ms"] >= 0 for r in records)
""","転送込みはCPU→GPUの入力2枚、計算、GPU→CPUの結果を含みます。GPUメモリ割当ての費用も入る測り方です。計算のみと同じ基準の「速度比」だと読み替えないでください。メモリ不足の場合はサイズを下げます。")
step(nb,"計測結果を可視化する","横軸を行列の1辺のサイズ、縦軸を実測の中央値にします。",
"""
fig, ax = plt.subplots(figsize=(7,4))
for dev in sorted({r["device"] for r in records}):
    rows = [r for r in records if r["device"]==dev]
    ax.plot([r["n"] for r in rows], [r["compute_ms"] for r in rows], "o-", label=dev+" compute")
    if dev != "cpu":
        ax.plot([r["n"] for r in rows], [r["transfer_ms"] for r in rows], "s--", label=dev+" incl. transfer")
ax.set(xlabel="Matrix side length", ylabel="Median time (ms)", yscale="log")
ax.legend(); ax.grid(alpha=.2)
plt.tight_layout(); plt.show()
""","計測値はこの機械・電源状態・バックエンド・ライブラリ版に依存します。小さな行列では転送や起動の費用が目立ち、GPUが常に速いとは限りません。GPUなしならCPUの線だけを見ます。")
step(nb,"条件を変える実験","512×512のCPU行列積でスレッド数1・2を比較します。他のソフトウェアの負荷も結果に影響します。",
"""
try:
    for threads in [1,2]:
        torch.set_num_threads(threads)
        a = torch.randn(512,512)
        b = torch.randn(512,512)
        print("CPU threads", threads, "median ms", round(median_ms(lambda: a @ b, torch.device("cpu")),4))
finally:
    torch.set_num_threads(2)
""","同じ計算でも条件で時間は変わります。元の測定をやり直す場合はスレッド数やサイズ、回数の条件をそろえてください。")
save(nb,"03_pytorch_gpu.ipynb","- [PyTorch CUDA synchronize](https://docs.pytorch.org/docs/stable/generated/torch.cuda.synchronize.html)\n- [PyTorch MPS synchronize](https://docs.pytorch.org/docs/stable/generated/torch.mps.synchronize.html)\n- [PyTorch benchmarkの解説](https://docs.pytorch.org/tutorials/recipes/recipes/benchmark.html)","演算そのものとデータ転送、非同期処理の同期を区別して時間を比較しました。保存済み出力で測定できたデバイスを確認してください。利用できないGPUの性能は推測しません。")

nb=notebook("04_image_classification.ipynb","04 学習済みCNNによる画像分類","ResNet18で前処理→予測→上位5クラスを実行し、画像分類の範囲と限界を考えます。","PyTorch、torchvision、Pillow、Matplotlib")
step(nb,"概要・画像・モデル","torchvisionのResNet18とIMAGENET1K_V1重みを使います。初回は約45MBの重みをdownload.pytorch.orgから取得し、PyTorchのキャッシュに保存します。以降はキャッシュがあれば再ダウンロードしません。入力はNASA撮影のEileen Collinsの写真（Public Domain、scikit-image配布）です。\n\nオフラインでは事前に重みをキャッシュし、同梱assets/astronaut.pngを配置します。Notebookだけ取得した場合、画像を公式scikit-imageリポジトリからダウンロードします。ネットワークがなく必要なファイルもない場合は、推論できないことを表示し、未学習重みの予測で代用しません。",
"""
import sys
from pathlib import Path
from urllib.request import urlopen
import hashlib
from io import BytesIO
import matplotlib.pyplot as plt
from PIL import Image
import PIL
import torch, torchvision
from torchvision.models import resnet18, ResNet18_Weights
torch.manual_seed(7)
torch.set_num_threads(2)
print("Python:",sys.version.split()[0],"torch:",torch.__version__,
      "torchvision:",torchvision.__version__,"Pillow:",PIL.__version__)
image = None
path = Path("assets/astronaut.png")
image_url = "https://raw.githubusercontent.com/scikit-image/scikit-image/v0.25.2/skimage/data/astronaut.png"
try:
    content = path.read_bytes() if path.exists() else urlopen(image_url, timeout=20).read()
    image = Image.open(BytesIO(content)).convert("RGB")
    print("入力画像SHA256:", hashlib.sha256(content).hexdigest())
    plt.figure(figsize=(4,4)); plt.imshow(image); plt.axis("off")
    plt.title("NASA / Eileen Collins (Public Domain)")
    plt.show()
except (OSError, ValueError) as error:
    print("画像が読めません。assets/astronaut.pngを配置して再実行してください。", type(error).__name__)
""","写真の人物の身元を予測する実験ではありません。クラスはImageNetの1000分類であり、画像の一般的な意味をすべて説明するものではありません。画像の出典とライセンスは末尾に記載しています。")
step(nb,"重みの取得と前処理","学習済み重みに対応する公式transformsを使い、RGB→リサイズ→中央224×224切出し→0〜1のテンソル→ImageNet平均・標準偏差で正規化します。",
"""
weights = ResNet18_Weights.IMAGENET1K_V1
model = None
batch = None
try:
    model = resnet18(weights=weights).eval()
    print("学習済み重み:", weights)
except (OSError, RuntimeError, ValueError) as error:
    print("学習済み重みを取得できません。オンラインで一度実行するか、重みをPyTorchキャッシュへ配置してください。",
          type(error).__name__)
if image is not None and model is not None:
    batch = weights.transforms()(image).unsqueeze(0)
    assert batch.shape == (1,3,224,224)
    print("前処理後の形:", tuple(batch.shape))
    # 表示用に正規化だけを元へ戻す。切出し後の画像を示す。
    shown = batch[0] * torch.tensor([.229,.224,.225])[:,None,None] + torch.tensor([.485,.456,.406])[:,None,None]
    plt.figure(figsize=(3,3)); plt.imshow(shown.permute(1,2,0).clamp(0,1))
    plt.title("Center crop used by the model"); plt.axis("off"); plt.show()
""","中央切出しによって画像の一部は使われません。入力の扱いも結果に影響します。eval()は推論時の振る舞いを指定する操作で、学習済み重みを新しく学習し直す操作ではありません。")
step(nb,"推論と上位5クラス","CPUで学習済みモデルを実行し、Softmaxの上位5出力を表示します。ImageNetのクラス名は公式の英語表記を使います。",
"""
probabilities = None
if batch is not None and model is not None:
    with torch.inference_mode():
        probabilities = model(batch).softmax(dim=1)[0]
    values, indices = probabilities.topk(5)
    assert abs(float(probabilities.sum())-1) < 1e-5
    labels = [weights.meta["categories"][int(i)] for i in indices]
    for label, value in zip(labels, values):
        print(f"{label}: {100*float(value):.2f}%")
    fig, ax = plt.subplots(figsize=(7,3))
    ax.barh(labels[::-1], values.flip(0).numpy()*100, color="#4b286d")
    ax.set_xlabel("Softmax output (%)")
    plt.tight_layout(); plt.show()
else:
    print("画像または学習済み重みがないため、推論をスキップしました。")
""","上位クラスは、モデルが1000クラスの中から選んだ候補です。Softmax値はこの画像で本当にその対象であるという保証ではありません。ImageNetの出力には人物の身元や画像の詳細な説明は含まれません。")
step(nb,"条件を変える実験","同じ写真を左右反転して入力し、上位候補を比べます。別の写真を使う場合も権利を確認し、RGBに変換して同じ前処理を適用します。",
"""
if image is not None and model is not None:
    flipped = image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    with torch.inference_mode():
        altered = model(weights.transforms()(flipped).unsqueeze(0)).softmax(dim=1)[0]
    values, indices = altered.topk(5)
    print("左右反転した画像の上位5クラス")
    for i, value in zip(indices, values):
        print(weights.meta["categories"][int(i)], f"{100*float(value):.2f}%")
else:
    print("必要な入力がないため、条件変更の実験をスキップしました。")
""","見た目の変更にどの程度頑健かを調べる一例です。1枚の結果からモデル全体の性能を決めつけることはできません。")
save(nb,"04_image_classification.ipynb","- [ResNet18の公式重みと前処理](https://docs.pytorch.org/vision/stable/models/generated/torchvision.models.resnet18.html)\n- [scikit-image astronaut画像の出典・Public Domain表記](https://scikit-image.org/docs/0.25.x/api/skimage.data.html#skimage.data.astronaut)\n- [配布元の画像（v0.25.2）](https://github.com/scikit-image/scikit-image/blob/v0.25.2/skimage/data/astronaut.png)\n- [NASAの原画像・Public Domain表記](https://www.dvidshub.net/image/861340/astronaut-eileen-collins)\n\n同梱画像：NASA撮影、scikit-image収録astronaut.png、512×512、未改変。画像分類の教育用途。モデル重みはリポジトリへ同梱しません。","既存の重みを読み込み、画像を前処理し、推論して候補を表示できました。このNotebookでは追加学習は行わず、学習済みモデルを利用しました。")
