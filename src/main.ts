import { mountGradientDescent } from "./demos/gradient-descent/view";
import { mountDigitTraining } from "./demos/digit-training/view";
import { mountActivation } from "./demos/activation-functions/view";
import { mountConfusion } from "./demos/confusion-matrix/view";
import { mountXor } from "./demos/xor-network/view";
import { mountQMaze } from "./demos/q-maze/view";
import { mountMCTS } from "./demos/mcts-search/view";
import { mountShortcut } from "./demos/shortcut-learning/view";
import { mountWeighted, mountLearning } from "./demos/perceptron-learning/view";
import { mountKmeans } from "./demos/kmeans/view";
import { mountOverfit } from "./demos/overfitting/view";
import { mountUniversalApproximation } from "./demos/universal-approximation/view";
import {
  session07Materials,
  session07Path,
  session07Title,
  session07Summary,
} from "./sessions/session07";
import {
  renderSession07,
  mountNotebook07,
  mountMaterial07,
} from "./sessions/session07View";
import { mountEliza } from "./demos/eliza/view";
import { mountRules } from "./demos/rule-inference/view";
import {
  session06Summary,
  session06Title,
  session06Demos,
} from "./sessions/session06";
import { renderSession06 } from "./sessions/session06View";
import { mountMaze, mountSearch } from "./demos/maze-search/view";
import { mountRiver } from "./demos/river-crossing/view";
import { mountTree } from "./demos/search-tree/view";
import { mountSingle, mountMulti } from "./demos/perceptron/view";
import { mountTSP } from "./demos/traveling-salesperson/view";
import { mountPvsNP } from "./demos/p-vs-np/view";
import { mountHalting } from "./demos/halting-problem/view";
import { mountWebRequest } from "./demos/web-request-php/view";
import { mountParadigms } from "./demos/programming-paradigms/view";
import { mountPipeline } from "./demos/function-pipeline/view";
import { mountFamily } from "./demos/prolog-family/view";
import { mountProlog } from "./demos/prolog-inference/view";
import { session05Demos, session05Summary } from "./sessions/session05";
import { renderSession05 } from "./sessions/session05View";
import { mountSession05Placeholder } from "./components/session05Placeholder";
import "./styles/theme.css";
import { demos } from "./sessions/catalog";
import { parseRoute } from "./utils/router";
import { mountWheel } from "./demos/wheel-aliasing/view";
import { mountSpatial } from "./demos/spatial-sampling/view";
import { mountRolling } from "./demos/rolling-shutter/view";
import { mountMemory } from "./demos/memory-hierarchy/view";
import { mountMoore } from "./demos/moores-law/view";
import { mountLogic } from "./demos/logic-gates/view";
import { mountAdder } from "./demos/binary-adder/view";
import { session04Demos, session04Summary } from "./sessions/session04";
import { renderSession04 } from "./sessions/session04View";
import { mountSession04Placeholder } from "./components/demoLayout";
import { mountSR } from "./demos/sr-latch/view";
import { mountClock } from "./demos/d-latch-flipflop/view";
import { mountCPU } from "./demos/cpu-cycle/view";
import { mountLanguage } from "./demos/language-to-cpu/view";
import { mountTransistor } from "./demos/transistor-logic/view";
import { mountTuring } from "./demos/turing-machine/view";
const publishedCount = demos.filter((demo) => demo.ready).length;
const root = document.querySelector<HTMLElement>("#content");
if (!root) throw new Error("本文の要素がありません");
let cleanup: (() => void) | undefined;
const card = (demo: (typeof demos)[number], index: number) =>
  `<a class="card ${demo.ready ? "available" : ""}" href="#/sessions/03/${demo.slug}"><div class="card-top"><span class="demo-icon" aria-hidden="true">${demo.icon}</span><span class="badge">${demo.ready ? "体験できます" : "準備中"}</span></div><p class="eyebrow">DEMO ${String(index + 1).padStart(2, "0")} / ${demo.tag}</p><h2>${demo.title}</h2><p>${demo.description}</p><span class="card-link">${demo.ready ? "デモを開く" : "内容を見る"} <span aria-hidden="true">↗</span></span></a>`;
function render(): void {
  if (!root) return;
  cleanup?.();
  cleanup = undefined;
  const route = parseRoute(location.hash);
  if (route.kind === "home") {
    document.title = "情報科学A | 立教大学";
    root.innerHTML = `<section class="hero"><p class="eyebrow">RIKKYO UNIVERSITY / INFORMATION SCIENCE A</p><h1>見て、動かして、<br><em>しくみ</em>をつかもう。</h1><p class="lead">コンピュータの「なぜ？」を、小さな実験から。<br>予想して、試して、自分の言葉で説明してみよう。</p><span class="hero-symbol" aria-hidden="true">01<br>10</span></section><div class="section-heading"><h2>授業から探す</h2><span>SESSIONS</span></div><a class="session-card" href="#/sessions/03"><span class="session-number">03</span><div><p class="eyebrow">第3回 / 7つの実験</p><h2>コンピュータの仕組み</h2><p>映像の見え方から、記憶と計算のしくみまで。</p><span class="badge">${publishedCount}件公開中${demos.length > publishedCount ? ` · ${demos.length - publishedCount}件準備中` : ""}</span></div><span class="arrow" aria-hidden="true">→</span></a><a class="session-card session04-card" href="#/sessions/04"><span class="session-number">04</span><div><p class="eyebrow">Information Science A / Session 04</p><h2>記憶回路からCPU・機械語へ</h2><p>0と1の記憶から、命令を実行するしくみへ。</p><span class="badge">${session04Summary}</span></div><span class="arrow" aria-hidden="true">→</span></a><a class="session-card" href="#/sessions/05"><span class="session-number">05</span><div><p class="eyebrow">Information Science A / Session 05</p><h2>プログラミング言語と計算の限界</h2><p>計算の表し方から、計算できること・難しいことへ。</p><span class="badge">${session05Summary}</span></div><span class="arrow" aria-hidden="true">→</span></a><a class="session-card" href="#/sessions/06"><span class="session-number">06</span><div><p class="eyebrow">Information Science A / Session 06</p><h2>${session06Title}</h2><p>ニューラルネットワークから、探索・推論・対話へ。</p><span class="badge">${session06Summary}</span></div><span class="arrow" aria-hidden="true">→</span></a><a class="session-card" href="${session07Path}"><span class="session-number">07</span><div><p class="eyebrow">Information Science A / Session 07</p><h2>${session07Title}</h2><p>データからの学習と、未知のデータへの予測を体験しよう。</p><span class="badge">${session07Summary}</span></div><span class="arrow" aria-hidden="true">→</span></a><p class="note">事前知識は不要です。気になるデモから始めてください。</p>`;
  } else if (route.kind === "session07") {
    document.title = session07Title + " | 情報科学A 第7回";
    root.innerHTML = renderSession07();
  } else if (route.kind === "material07") {
    const material = session07Materials.find((m) => m.slug === route.slug);
    if (material) {
      document.title =
        material.title +
        (material.ready ? "" : "（準備中）") +
        " | 情報科学A 第7回";
      const mounts = {
        "activation-functions": mountActivation,
        "confusion-matrix": mountConfusion,
        "xor-neural-network": mountXor,
        "reinforcement-learning": mountQMaze,
        "alphago-search": mountMCTS,
        "shortcut-learning": mountShortcut,
        "weighted-sum": mountWeighted,
        "perceptron-learning": mountLearning,
        kmeans: mountKmeans,
        overfitting: mountOverfit,
        "gradient-descent": mountGradientDescent,
        "digit-network-js": (root: HTMLElement) => mountDigitTraining(root, "js"),
        "digit-network-tfjs": (root: HTMLElement) => mountDigitTraining(root, "tf"),
        "universal-approximation": mountUniversalApproximation,
      };
      if (!material.ready) cleanup = mountMaterial07(root, material);
      else if (material.kind === "notebook")
        cleanup = mountNotebook07(root, material);
      else cleanup = mounts[material.slug](root);
    } else missing();
  } else if (route.kind === "session06") {
    document.title = session06Title + " | 情報科学A 第6回";
    root.innerHTML = renderSession06();
  } else if (route.kind === "demo06") {
    const demo = session06Demos.find((d) => d.slug === route.slug);
    if (!demo) missing();
    else {
      document.title =
        demo.title + (demo.ready ? "" : "（準備中）") + " | 情報科学A 第6回";
      const views = {
        "single-perceptron": mountSingle,
        "multilayer-xor": mountMulti,
        maze: mountMaze,
        "graph-search": mountSearch,
        "river-crossing": mountRiver,
        "search-tree": mountTree,
        "if-then": mountRules,
        "reasoning-direction": (root: HTMLElement) => mountRules(root, true),
        prolog: mountFamily,
        eliza: mountEliza,
      };
      cleanup = views[demo.slug](root);
    }
  } else if (route.kind === "session05") {
    document.title = "第5回 プログラミング言語と計算の限界 | 情報科学A";
    root.innerHTML = renderSession05();
  } else if (route.kind === "demo05") {
    const demo = session05Demos.find((d) => d.slug === route.slug);
    if (demo) {
      document.title = `${demo.title}${demo.ready ? "" : "（準備中）"} | 情報科学A 第5回`;
      cleanup =
        demo.slug === "programming-paradigms"
          ? mountParadigms(root)
          : demo.slug === "function-pipeline"
            ? mountPipeline(root)
            : demo.slug === "prolog-inference"
              ? mountProlog(root)
              : demo.slug === "web-request-php"
                ? mountWebRequest(root)
                : demo.slug === "halting-problem"
                  ? mountHalting(root)
                  : demo.slug === "traveling-salesperson"
                    ? mountTSP(root)
                    : demo.slug === "p-vs-np"
                      ? mountPvsNP(root)
                      : mountSession05Placeholder(root, demo);
    } else missing();
  } else if (route.kind === "session04") {
    document.title = "第4回 記憶回路からCPU・機械語へ | 情報科学A";
    root.innerHTML = renderSession04();
  } else if (route.kind === "demo04") {
    const demo = session04Demos.find((d) => d.slug === route.slug);
    if (demo) {
      document.title = `${demo.title}${demo.ready ? "" : "（準備中）"} | 情報科学A 第4回`;
      cleanup =
        demo.slug === "sr-latch"
          ? mountSR(root)
          : demo.slug === "d-latch-flipflop"
            ? mountClock(root)
            : demo.slug === "cpu-cycle"
              ? mountCPU(root)
              : demo.slug === "pc-branch"
                ? mountCPU(root, true)
                : demo.slug === "language-to-cpu"
                  ? mountLanguage(root)
                  : demo.slug === "transistor-logic"
                    ? mountTransistor(root)
                    : demo.slug === "turing-machine"
                      ? mountTuring(root)
                      : mountSession04Placeholder(root, demo);
    } else missing();
  } else if (route.kind === "session") {
    document.title = "第3回 コンピュータの仕組み | 情報科学A";
    root.innerHTML = `<a class="back" href="#/">← 授業一覧</a><div class="page-heading"><p class="eyebrow">SESSION 03</p><h1>コンピュータの仕組み</h1><p class="lead">見える世界と、コンピュータが読み取る世界。<br>7つの実験で、その間をのぞいてみよう。</p></div><div class="section-heading"><h2>インタラクティブ・デモ</h2><span>${String(publishedCount).padStart(2, "0")} / ${String(demos.length).padStart(2, "0")} 公開中</span></div><div class="card-grid">${demos.map(card).join("")}</div>`;
  } else if (route.kind === "demo") {
    const demo = demos.find((d) => d.slug === route.slug);
    if (demo?.ready) {
      document.title = `${demo.title} | 情報科学A`;
      cleanup =
        demo.slug === "binary-adder"
          ? mountAdder(root)
          : demo.slug === "logic-gates"
            ? mountLogic(root)
            : demo.slug === "moores-law"
              ? mountMoore(root)
              : demo.slug === "memory-hierarchy"
                ? mountMemory(root)
                : demo.slug === "rolling-shutter"
                  ? mountRolling(root)
                  : demo.slug === "spatial-sampling"
                    ? mountSpatial(root)
                    : mountWheel(root);
    } else if (demo) {
      document.title = `${demo.title}（準備中） | 情報科学A`;
      root.innerHTML = `<a class="back" href="#/sessions/03">← 第3回のデモ一覧</a><section class="empty"><span class="demo-icon" aria-hidden="true">${demo.icon}</span><p class="eyebrow">COMING SOON</p><h1>${demo.title}</h1><p>${demo.description}</p><p>このデモは準備中です。今は「回転円盤とフレームレート」を体験できます。</p><a class="button primary" href="#/sessions/03/wheel-aliasing">公開中のデモへ →</a></section>`;
    } else missing();
  } else missing();
  root.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}
function missing(): void {
  if (root) {
    document.title = "ページが見つかりません | 情報科学A";
    root.innerHTML =
      '<section class="empty"><h1>ページが見つかりません</h1><a href="#/">授業一覧へ戻る</a></section>';
  }
}
document
  .querySelector<HTMLAnchorElement>(".skip")
  ?.addEventListener("click", (event) => {
    event.preventDefault();
    root.focus();
  });
window.addEventListener("hashchange", render);
render();
