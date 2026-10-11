import "./styles/theme.css";
import { demos } from "./sessions/catalog";
import { parseRoute } from "./utils/router";
import { mountWheel } from "./demos/wheel-aliasing/view";
import { mountSpatial } from "./demos/spatial-sampling/view";
import { mountRolling } from "./demos/rolling-shutter/view";
import { mountMemory } from "./demos/memory-hierarchy/view";
import { mountMoore } from "./demos/moores-law/view";
import { mountLogic } from "./demos/logic-gates/view";
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
    root.innerHTML = `<section class="hero"><p class="eyebrow">RIKKYO UNIVERSITY / INFORMATION SCIENCE A</p><h1>見て、動かして、<br><em>しくみ</em>をつかもう。</h1><p class="lead">コンピュータの「なぜ？」を、小さな実験から。<br>予想して、試して、自分の言葉で説明してみよう。</p><span class="hero-symbol" aria-hidden="true">01<br>10</span></section><div class="section-heading"><h2>授業から探す</h2><span>SESSIONS</span></div><a class="session-card" href="#/sessions/03"><span class="session-number">03</span><div><p class="eyebrow">第3回 / 7つの実験</p><h2>コンピュータの仕組み</h2><p>映像の見え方から、記憶と計算のしくみまで。</p><span class="badge">${publishedCount}件公開中 · ${demos.length - publishedCount}件準備中</span></div><span class="arrow" aria-hidden="true">→</span></a><p class="note">事前知識は不要です。気になる実験から始めてください。</p>`;
  } else if (route.kind === "session") {
    document.title = "第3回 コンピュータの仕組み | 情報科学A";
    root.innerHTML = `<a class="back" href="#/">← 授業一覧</a><div class="page-heading"><p class="eyebrow">SESSION 03</p><h1>コンピュータの仕組み</h1><p class="lead">見える世界と、コンピュータが読み取る世界。<br>7つの実験で、その間をのぞいてみよう。</p></div><div class="section-heading"><h2>インタラクティブ・デモ</h2><span>${String(publishedCount).padStart(2, "0")} / ${String(demos.length).padStart(2, "0")} 公開中</span></div><div class="card-grid">${demos.map(card).join("")}</div>`;
  } else if (route.kind === "demo") {
    const demo = demos.find((d) => d.slug === route.slug);
    if (demo?.ready) {
      document.title = `${demo.title} | 情報科学A`;
      cleanup =
        demo.slug === "logic-gates"
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
