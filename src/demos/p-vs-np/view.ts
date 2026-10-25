import { mountStepLesson } from "../../components/stepLesson";
import { session05Demos } from "../../sessions/session05";
import {
  cities,
  enumerateTours,
  shortestTour,
  routeNames,
  verifyCertificate,
} from "../tsp-shared/model";
import { mountCityMap } from "../tsp-shared/view";
export function mountPvsNP(root: HTMLElement): () => void {
  const tours = enumerateTours(cities),
    best = shortestTour(cities),
    worst = tours.reduce((a, b) => (a.distance > b.distance ? a : b));
  const abort = new AbortController();
  let examined = 0,
    found = false;
  const layout = mountStepLesson(root, session05Demos[6], () => {
    threshold.value = String(best.distance);
    candidate.value = "best";
    restart();
  });
  layout.instructions.textContent =
    "「探す」では候補を1つずつ調べ、「距離D以下の巡回路があるか」を探します。「確認する」では提示された1つの候補を、共通の1ステップ／自動実行で検証します。Dや候補を変えると探索と検証を最初に戻します。";
  layout.body.innerHTML = `<p class="goal">問い：距離D以下の巡回路はある？<br>前のデモの「最短路を求める」最適化問題から、YES／NOで答える判定問題へ変えています。</p><label class="lesson-field">距離の上限 D<select id="np-threshold"><option value="${best.distance - 1}">${best.distance - 1}（最短より1短い）</option><option value="${best.distance}" selected>${best.distance}（最短と同じ）</option><option value="${worst.distance}">${worst.distance}（全候補を許す）</option></select></label><div class="lesson-grid"><section class="lesson-panel"><h2>探す：候補を調べる</h2><p>固定の5都市の12候補を順に調べる総当たりです。YESの候補が見つかれば終了。NOと結論するには、この探索では全候補を調べます。</p><button id="np-search">候補を1つ調べる</button><p id="np-search-state" class="storage-result" role="status" aria-atomic="true"></p><p id="np-search-route"></p><ol id="np-search-history" class="lesson-trace"></ol></section><section class="lesson-panel"><h2>確認する：提示された候補を検証</h2><label class="lesson-field">候補巡回路<select id="np-candidate"><option value="best">最短の巡回路</option><option value="worst">長い巡回路</option><option value="duplicate">都市の重複・抜けがある例</option><option value="open">出発点に戻らない例</option></select></label><div id="np-map"></div><ol id="np-checks" class="lesson-trace"></ol><p id="np-verdict" class="storage-result"></p><p class="hint">この候補の検証がNOでも、別の候補がYESかもしれません。「確認する」は問題全体にNOと答える手続きではありません。</p></section></div><section id="np-definitions" class="lesson-panel"><h2>PとNP</h2><p><strong>P：</strong>入力の長さに対して、多項式時間でYES／NOを判定できる問題の集まり。</p><p><strong>NP：</strong>YESの証拠を、入力の長さに対して多項式時間で確認できる判定問題の集まり。</p><p class="halting-equation">P ⊆ NP</p><p>効率よく判定できれば、YESの証拠も効率よく確認できます。</p><p class="goal">証拠を効率よく確認できるなら、その問題自体も効率よく判定できるのか？ → P=NP? → 未解決</p><p>NPは「解けない問題」という意味ではありません。この5都市の例の速さを測ってPとNPの違いを証明しているわけではありません。</p></section><p>距離は前のデモと同じ整数の辺の重みです。都市の重複・帰還・各辺の重みの加算・Dとの比較を確認します。一般の判定問題では、入力長に距離やDの表現に必要なビット数も含めて考えます。</p><p class="goal">総当たりが大変でも、速い解法が存在しないと証明したことにはなりません。</p><p>停止性問題：万能な解法が存在しない → TSP：手順はあるが候補が急増 → P/NP：効率的な確認と判定の関係を問う。</p>`;
  const threshold = root.querySelector<HTMLSelectElement>("#np-threshold")!,
    candidate = root.querySelector<HTMLSelectElement>("#np-candidate")!;
  const map = mountCityMap(root.querySelector<HTMLElement>("#np-map")!);
  function searchRender() {
    const done = found || examined === tours.length;
    root.querySelector<HTMLButtonElement>("#np-search")!.disabled = done;
    root.querySelector("#np-search-state")!.textContent =
      `${examined} / 12候補を確認：${found ? "YES（条件を満たす巡回路が見つかった）" : done ? "NO（全候補がDを超えた）" : "探索前・探索中"}`;
    const last = tours[examined - 1];
    root.querySelector("#np-search-route")!.textContent = last
      ? `直前：${routeNames(last.route)} ／ 距離${last.distance}`
      : "候補をまだ調べていません。";
    root.querySelector("#np-search-history")!.innerHTML = tours
      .slice(0, examined)
      .map(
        (tour) =>
          `<li>${routeNames(tour.route)} ／ ${tour.distance} ${tour.distance <= Number(threshold.value) ? "≤" : ">"} D=${threshold.value}</li>`,
      )
      .join("");
  }
  function restart() {
    examined = 0;
    found = false;
    searchRender();
    const route =
      candidate.value === "best"
        ? best.route
        : candidate.value === "worst"
          ? worst.route
          : candidate.value === "duplicate"
            ? [0, 1, 1, 3, 4, 0]
            : [0, 1, 2, 3, 4];
    map.update(route);
    const result = verifyCertificate(cities, route, Number(threshold.value));
    const steps = [
      `全都市を1回ずつ訪れる：${result.allOnce ? "OK" : "NG（重複・抜けがあります）"}`,
      `出発点へ戻る：${result.closed ? "OK" : "NG（戻っていません）"}`,
      result.distance === null
        ? "距離計算：巡回路の条件を満たさないため、証拠として採用しません。"
        : `各辺の距離を足す：${result.distance}`,
      result.distance === null
        ? "D以下の判定：前提の巡回路が不正なので不合格。"
        : `距離${result.distance} ≤ D=${threshold.value}：${result.accepted ? "成立" : "不成立"}`,
    ];
    layout.setFrames(5, (index) => {
      root.querySelector("#np-checks")!.innerHTML = steps
        .map(
          (text, i) =>
            `<li ${i === index - 1 ? 'aria-current="step"' : ""}>${i < index ? text : `${["全都市を1回ずつ訪れる", "出発点へ戻る", "距離を計算", "距離 ≤ D"][i]}：未確認`}</li>`,
        )
        .join("");
      root.querySelector("#np-verdict")!.textContent =
        index < 4
          ? `検証：${index} / 4手順`
          : `この候補の検証：${result.accepted ? "YES（問題へのYESの証拠）" : "NO（この候補は条件を満たさない）"}`;
      root.querySelector<HTMLElement>("#np-definitions")!.hidden = index < 4;
      layout.status.textContent =
        index === 0
          ? "提示された巡回路を順に確認します。「探す」とは独立した操作です。"
          : index === 4
            ? `${steps[3]} ${result.accepted ? "1つの証拠で問題にYESと答えられます。" : "別の候補が存在する可能性は、この検証だけでは否定できません。"}`
            : steps[index - 1]!;
    });
  }
  root.querySelector("#np-search")!.addEventListener(
    "click",
    () => {
      if (found || examined === tours.length) return;
      found = tours[examined]!.distance <= Number(threshold.value);
      examined++;
      searchRender();
    },
    { signal: abort.signal },
  );
  threshold.addEventListener("change", restart, { signal: abort.signal });
  candidate.addEventListener("change", restart, { signal: abort.signal });
  restart();
  return () => {
    abort.abort();
    map.dispose();
    layout.dispose();
  };
}
