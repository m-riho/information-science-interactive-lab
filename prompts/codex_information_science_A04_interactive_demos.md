# Codex開発指示書：情報科学A 第4回 インタラクティブデモ

## 1. 目的

立教大学
全学共通科目（一般教養）「情報科学A」第4回の授業内容を、学生がブラウザ上で操作しながら理解できるインタラクティブ教材として実装する。

中心テーマ：

``` text
論理ゲート → 記憶回路 → レジスタ・PC → 機械語
→ Fetch / Decode / Execute → 高水準言語からCPUを利用
```

ハードウェア側：

``` text
半導体 → トランジスタ → 論理ゲート
→ 加算器・フリップフロップ → CPU・レジスタ → コンピュータ
```

文系学生を主な対象とし、高校「情報」未履修者も想定する。専門的な回路設計や実CPUの厳密なエミュレーションではなく、概念を操作して理解する教育用シミュレーションとする。

## 2. 既存プロジェクトへの統合

第3回用 `Information Science Interactive Lab`
が存在する場合、新規プロジェクトを作らず **Information Science A /
Session 04** として追加する。

最初に
`README.md`、`AGENTS.md`、`package.json`、Vite設定、`src/`、Session
03、ルーティング、共通UI、GitHub
Pages/Actions、テーマCSSを調査する。既存設計を尊重し、不要な全面書き換えをしない。

既存構成がない場合の基本： - TypeScript - Vite -
p5.js（必要な視覚化のみ） - HTML/CSS - Git - GitHub Pages - GitHub
Actions - 外部依存は最小限

## 3. 公開構成

情報科学A/Bを明確に区別する。既存ルーティングがあれば優先する。

例：

``` text
#/a/sessions/04
#/a/sessions/04/sr-latch
#/a/sessions/04/d-latch-flipflop
#/a/sessions/04/cpu-cycle
```

## 4. デザイン・アクセシビリティ

既存サイトの立教大学授業用の紫系デザインを維持する。公式ロゴ等は利用可能素材がない限り追加しない。

-   PC/タブレット/スマートフォン対応
-   プロジェクタでも読みやすい
-   色だけに依存せず文字・形でも状態を表す
-   0/1、ON/OFFを明確化
-   十分なタッチ領域
-   `prefers-reduced-motion` 対応
-   全デモにリセット
-   必要に応じ「1ステップ」「自動実行」「停止」
-   状態変化を即座に視覚化
-   キーボード操作とfocus表示にも配慮

## 5. Session 04 トップ

カード形式で以下7本を表示する。 1. SRラッチ：1 bitを記憶する 2. Dラッチ
vs Dフリップフロップ 3. CPU命令実行シミュレータ 4.
プログラムカウンタと条件分岐 5. 高水準言語 → 機械語 → CPU 6.
トランジスタ → 論理ゲート 7. 小さなチューリングマシン

各カード：タイトル、1行説明、学習キーワード、「デモを開く」。

------------------------------------------------------------------------

## 6. Demo 1：SRラッチ

### 学習目標

組合せ回路と順序回路、フィードバック、1 bitの状態保持を理解する。

### UI

NORゲート2個の交差接続を表示。S/R/Q/Q̅、フィードバック線を明示。
操作：Set、Reset、S/R個別0/1、リセット。

### 動作（NOR型）

  S   R   動作
  --- --- ----------------------
  0   0   状態保持
  1   0   Set：Q=1
  0   1   Reset：Q=0
  1   1   禁止／不定として警告

`S=0,R=0`
で以前のQが保持される点を強調し、「入力を元に戻してもQが残る＝状態を記憶する」と表示する。禁止状態は実機の不定挙動を無理に再現しない。

## 7. Demo 2：Dラッチ vs Dフリップフロップ

### 学習目標

レベル感応とエッジ感応、クロックの役割を理解する。

左右比較表示。D/CLK/Qとタイミングチャートを双方に表示。 操作：D 0/1、CLK
0/1、クロック1周期、自動クロック、停止、リセット。

Dラッチ： - CLK=1の間QはDに追従 - CLK=0の間Qを保持

D-FF： - 立ち上がりエッジでDを取り込む - 次の立ち上がりまでQを保持

補助説明：「ラッチは開いている間に通す」「FFは瞬間に記憶する」。

## 8. Demo 3：CPU命令実行シミュレータ

### 学習目標

メモリ、PC、レジスタ、Fetch→Decode→Executeを理解する。

教育用仮想ISAを使う。

``` text
00 LOAD 10
01 ADD 11
02 STORE 12
03 HALT
10 5
11 8
12 0
```

結果：Memory\[12\] = 13

UI： - メモリ表（PC行を強調） - CPU：Fetch/Decode/Execute -
PC、Instruction Register、Accumulator - 現在命令の日本語説明 -
1ステップ、1命令、自動実行、停止、リセット

アニメーション例：PC=00強調→LOAD
10をCPUへ→Decode→10番地の5をレジスタへ→PC更新。実CPUの厳密なタイミング再現は不要。

## 9. Demo 4：プログラムカウンタと条件分岐

### 学習目標

順次実行、ジャンプ、条件分岐、反復を理解する。

仮想命令：

``` text
LOAD addr
ADD addr
SUB addr
STORE addr
JMP addr
JZ addr
HALT
```

短時間で停止するカウントダウン等を用意。PCの動きを矢印や履歴で表示する。
表示：メモリ、PC、現在命令、レジスタ、Zero flag、実行履歴。
操作：1命令、自動、停止、リセット。
自動実行は最大ステップ数を設け、無限ループを防止する。

## 10. Demo 5：高水準言語 → 機械語 → CPU

### 学習目標

高水準言語、アセンブリ、機械語の階層と「翻訳」「抽象化」を理解する。

``` text
人間
↓
高水準言語
↓
翻訳
↓
アセンブリ言語
↓
機械語
↓
CPU
```

例：

``` text
c = a + b
```

概念的アセンブリ：

``` text
LOAD a
ADD b
STORE c
```

教育用機械語：

``` text
0001 0001
0010 0010
0011 0011
```

実在x86/ARMの正確なコンパイラではなく「教育用仮想命令セットによる概念シミュレーション」と明記する。機械語を2進/16進表示切替できてもよい。
操作：段階表示、翻訳、CPUで実行、最初から。

## 11. Demo 6：トランジスタ → 論理ゲート

### 学習目標

トランジスタ＝電気で制御するスイッチ、複数のトランジスタ→論理ゲート、という階層を理解する。

Stage 1：単純化MOSFET - Gate=0/1 - OFF/ONと電流の有無を視覚化 -
詳細電気特性の再現不要

Stage 2：CMOS NOT - 入力0→出力1 - 入力1→出力0

Stage 3：NAND - 可能なら4トランジスタCMOS NANDを表示 -
回路解析を学生に要求しない

重要な流れ：

``` text
複数のトランジスタ → NAND / NOT → 論理ゲート
→ 加算器・記憶回路 → CPU
```

「抽象化して見る／中身を見る」の切替があると望ましい。

## 12. Demo 7：小さなチューリングマシン

### 学習目標

計算を単純な規則の繰り返しとして捉え、テープ・ヘッド・状態・状態遷移を理解する。

初期例：「右端の空白を1に変更する」。

``` text
□ 1 1 1 □ □ □
  ^
  q0
```

  状態   読む   書く   移動   次状態
  ------ ------ ------ ------ --------
  q0     1      1      右     q0
  q0     □      1      停止   q1

UI：テープ、ヘッド、現在状態、状態遷移表、使用中規則の強調、ステップ数。
操作：1ステップ、自動、停止、リセット。
実行終了時に「単純な規則を順番に適用することで計算が進む」と説明する。

------------------------------------------------------------------------

## 13. 共通仕様

全デモに可能な限り共通UIを使う。

``` text
Information Science A
Session 04
```

共通要素： - 学習目標 - 操作方法 - デモ本体 -
「いま何が起きた？」説明欄 - リセット - 前／次 - Session 04トップへ

日本語主体、重要語のみ英語併記（Sequential Circuit, Latch, Flip-Flop,
Register, Program Counter, Fetch, Decode, Execute等）。

## 14. 教育上の注意

単純化した箇所には「このデモは概念理解のため単純化しています」と明示する。

暗記を要求しない： - MOSFET内部の詳細 - CMOS NANDのトランジスタ配置 -
実在ISAのopcode - 実CPUのパイプライン等 - ラッチ/FFの全種類

理解させたい： - 状態を保持できる - 複数bit→レジスタ -
PCが次の命令位置を保持 - CPUはFetch/Decode/Executeを繰り返す -
高水準言語から機械語へ抽象化階層がある -
トランジスタから論理回路を構成できる -
単純な規則の反復で計算を表現できる

## 15. 実装品質

-   TypeScriptの型エラーを残さない
-   console error/warningを可能な限り残さない
-   animation/timerを画面離脱時に停止
-   自動実行は暴走しない
-   UI状態と内部状態を分離
-   CPU/チューリングマシンの実行ロジックはUIから分離し、単体テスト可能にする
-   magic numberを避ける
-   共通部品を再利用する
-   既存Session 03を壊さない
-   GitHub Pagesのbase pathで動作する
-   URL直アクセス／リロードでも可能な範囲で破綻しない

## 16. テスト

最低限以下をテストする。

### SRラッチ

Set、Reset、保持、禁止状態。

### Dラッチ／FF

ラッチのCLK=1追従/0保持、FFの立ち上がり取り込み。

### CPU

LOAD/ADD/STORE/HALT、PC更新、最終値13、HALT後停止。

### 分岐

JMP、JZ成立/不成立、最大ステップ数。

### チューリングマシン

状態遷移、ヘッド移動、書込、停止。

加えて
`npm run typecheck`、`npm test`、`npm run build`（既存scripts名が異なる場合はそれに従う）を実行する。

## 17. README / AGENTS.md

READMEに以下を追記： - Session 04の目的 - 7デモ一覧 - ローカル実行 -
build/test - GitHub Pages - 教育用単純化について

AGENTS.mdがある場合は既存方針を維持して必要事項だけ追記する。なければ、構成・命名・テスト・教育用デモの原則を簡潔に記述して作成する。

## 18. Git運用

大きな変更を一括コミットせず、意味のある単位で分割する。

例：

``` text
feat(session04): add session landing page
feat(session04): add SR latch demo
feat(session04): add D latch and flip-flop demo
feat(session04): add CPU execution simulator
feat(session04): add program counter branch demo
feat(session04): add language translation demo
feat(session04): add transistor logic demo
feat(session04): add Turing machine demo
test(session04): add simulation tests
docs(session04): document interactive demos
```

既存リポジトリのcommit
conventionがあればそれを優先する。勝手にremoteへpushしない。

## 19. 実装フェーズ

一度に7本を雑に作らず段階的に進める。

### Phase 0：調査

既存構成を確認し、実装計画と変更対象ファイル一覧を提示する。まだ大規模変更しない。

### Phase 1：基盤

Session
04トップ、共通DemoLayout、共通コントロール、テーマ、ルーティング。

### Phase 2：記憶

Demo 1 SRラッチ、Demo 2 Dラッチ/FF。テスト・build。

### Phase 3：CPU

Demo 3 CPU cycle、Demo 4
PC/branch。実行ロジックをUIと分離。テスト・build。

### Phase 4：抽象化

Demo 5 高水準言語→機械語→CPU、Demo 6 トランジスタ→論理ゲート。

### Phase 5：計算可能性

Demo 7 チューリングマシン。

### Phase 6：仕上げ

レスポンシブ、アクセシビリティ、説明文、README、全テスト、production
build。

各Phase終了時に、 1. 実装内容 2. 変更ファイル 3. テスト結果 4.
未解決事項 を報告する。

## 20. 最初にCodexへ与える指示

このファイルをリポジトリのルート付近に保存した後、まず次のように指示する。

> この開発指示書を最後まで読んでください。まずPhase
> 0だけを実行してください。既存のInformation Science Interactive
> Labの構成、Session 03の実装、ルーティング、テーマ、GitHub
> Pages設定、テスト構成を調査し、Session
> 04の7本のデモを既存設計へ統合する実装計画を提示してください。この段階では大規模なコード変更をしないでください。

計画を確認した後：

> Phase 1とPhase 2を実装してください。既存Session
> 03を壊さず、SRラッチとDラッチ／Dフリップフロップを完成させ、型チェック・テスト・production
> buildまで実行してください。完了後、変更ファイルとテスト結果を報告してください。

その後、Phase 3以降を順番に実装する。

## 21. 完了条件

-   7本すべてがSession 04から開ける
-   全操作が実際に動作する
-   初学者向け説明がある
-   スマートフォンでも主要操作が可能
-   Session 03が壊れていない
-   型チェック、テスト、production build成功
-   GitHub Pages向けbuild成功
-   README更新済み
-   教育用単純化が明示されている
-   ソースコードが保守可能な構造になっている
