import { mountDemoLayout } from "../../components/demoLayout";
import { session05Config, session05Demos } from "../../sessions/session05";
import {
  candidateCount,
  cities,
  shortestTour,
  routeDistance,
  validateRoute,
} from "../tsp-shared/model";
import { mountCityMap } from "../tsp-shared/view";
export function mountTSP(root: HTMLElement): () => void {
  let route: number[] = [0];
  const abort = new AbortController();
  const layout = mountDemoLayout(
    root,
    session05Demos[5],
    {
      reset: () => {
        route = [0];
        countInput.value = "5";
        updateCount();
        render("初期状態：都市Aから出発します。");
      },
    },
    session05Config,
  );
  layout.instructions.textContent =
    "都市Aから出発します。地図上の都市ボタンを順番に選び、すべて訪れたらAを選んで戻ってください。距離は選ぶたびに更新します。最短ルートと比較し、下の都市数で候補の増え方を確かめましょう。";
  layout.body.innerHTML = `<div class="transport"><button id="tsp-undo">1つ戻す</button><button id="tsp-clear">ルートを消す</button><button id="tsp-best">最短ルートを見る</button></div><div class="lesson-grid"><section class="lesson-panel"><h2>5都市を巡ろう</h2><div id="tsp-map"></div><p class="hint">距離の単位は教材用。各辺の直線距離を切り上げた整数を使い、往復は同じ距離です。図は位置関係の模式表示です。</p></section><section class="lesson-panel"><h2>作ったルート</h2><p id="tsp-distance" class="storage-result"></p><p id="tsp-validation"></p><p id="tsp-comparison"></p><p>全都市間を移動できます。出発点A以外の都市を重複せず訪れ、最後にAへ戻ることが条件です。</p></section></div><section class="lesson-panel"><h2>都市が増えると候補は？</h2><label class="lesson-field">候補数を計算する都市数 n<select id="tsp-count">${[3, 5, 8, 10, 15, 20, 50, 100].map((n) => `<option value="${n}" ${n === 5 ? "selected" : ""}>${n}都市</option>`).join("")}</select></label><p id="tsp-count-result" class="lesson-value"></p><p>出発点を固定、逆回りを同一視、全都市間を移動可能、n≥3の場合：候補数 = (n−1)! / 2</p><p>5都市：12 ／ 10都市：181,440 ／ 15都市：43,589,145,600</p><p class="hint">上の地図は固定の5都市です。ここで都市数を増やしても地図は増えません。候補数だけを式で計算し、順列を生成しません。実全探索を呼び出せるのは8都市以下に制限しています。</p></section><p class="goal">総当たりが大変でも、速い解法が存在しないと証明したことにはなりません。</p><p>停止性問題と異なり、有限個の候補をすべて調べる手順はあります。次は「距離D以下の巡回路があるか」に問いを変え、探すことと確認することを比べます。</p>`;
  const countInput = root.querySelector<HTMLSelectElement>("#tsp-count")!;
  const map = mountCityMap(
    root.querySelector<HTMLElement>("#tsp-map")!,
    (city) => {
      if (validateRoute(cities, route).valid) {
        render(
          "巡回路は完成しています。「ルートを消す」または「1つ戻す」で作り直せます。",
        );
        return;
      }
      if (city === 0 && route.length === cities.length) {
        route = [...route, 0];
        render("全都市を訪れてAへ戻りました。巡回路が完成しました。");
        return;
      }
      if (route.includes(city)) {
        render(
          city === 0
            ? "Aへ戻る前に、残りの都市をすべて訪れてください。"
            : "その都市は訪問済みです。別の都市を選んでください。",
        );
        return;
      }
      route = [...route, city];
      render(
        `都市${cities[city]!.name}へ移動しました。${route.length === cities.length ? "最後にAへ戻りましょう。" : ""}`,
      );
    },
  );
  function render(message: string) {
    map.update(route);
    const valid = validateRoute(cities, route).valid,
      distance = routeDistance(cities, route);
    root.querySelector("#tsp-distance")!.textContent =
      `${valid ? "巡回距離" : "ここまでの距離"}：${distance}`;
    root.querySelector("#tsp-validation")!.textContent = valid
      ? "✓ 全都市を1回ずつ訪れ、出発点へ戻りました。"
      : `訪問済み：${new Set(route).size} / 5都市（未完成）`;
    root.querySelector("#tsp-comparison")!.textContent = valid
      ? `最短距離との差：${distance - shortestTour(cities).distance}（5都市の12候補で比較）`
      : "完成するまでは最短距離との差を比較しません。";
    root.querySelector<HTMLButtonElement>("#tsp-undo")!.disabled =
      route.length <= 1;
    layout.status.textContent = message;
  }
  function updateCount() {
    const n = Number(countInput.value);
    root.querySelector("#tsp-count-result")!.textContent =
      `${n}都市：${candidateCount(n).toLocaleString("ja-JP")}通り（式による計算）`;
  }
  root.querySelector("#tsp-undo")!.addEventListener(
    "click",
    () => {
      route = route.slice(0, -1);
      render("最後の移動を取り消しました。");
    },
    { signal: abort.signal },
  );
  root.querySelector("#tsp-clear")!.addEventListener(
    "click",
    () => {
      route = [0];
      render("都市Aから作り直します。");
    },
    { signal: abort.signal },
  );
  root.querySelector("#tsp-best")!.addEventListener(
    "click",
    () => {
      route = [...shortestTour(cities).route];
      render(
        "12候補を調べ、最短の巡回路を表示しました。同距離の最短路がある場合はその1つです。",
      );
    },
    { signal: abort.signal },
  );
  countInput.addEventListener("change", updateCount, { signal: abort.signal });
  updateCount();
  render("都市Aから出発します。次の都市を選んでください。");
  return () => {
    abort.abort();
    map.dispose();
    layout.dispose();
  };
}
