import { cities, routeNames } from "./model";
/** 固定の5都市を同じ配置で示す。操作用ボタンは更新しても作り直さない。 */
export function mountCityMap(
  host: HTMLElement,
  onCity?: (index: number) => void,
) {
  const abort = new AbortController();
  host.innerHTML = `<div class="city-map"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline class="city-route" points=""/></svg>${cities.map((city, i) => (onCity ? `<button type="button" data-city="${i}" style="left:${city.x}%;top:${city.y}%" aria-label="都市${city.name}を選ぶ">${city.name}</button>` : `<span class="city-dot" style="left:${city.x}%;top:${city.y}%">${city.name}</span>`)).join("")}</div><p class="city-route-label"></p>`;
  if (onCity)
    host.addEventListener(
      "click",
      (event) => {
        if (!(event.target instanceof Element)) return;
        const button =
          event.target.closest<HTMLButtonElement>("button[data-city]");
        if (button) onCity(Number(button.dataset.city));
      },
      { signal: abort.signal },
    );
  return {
    update(route: readonly number[]) {
      host.querySelector("polyline")!.setAttribute(
        "points",
        route
          .map((i) => {
            const c = cities[i];
            return c ? `${c.x},${c.y}` : "";
          })
          .join(" "),
      );
      host.querySelector(".city-route-label")!.textContent =
        `巡回路：${routeNames(route) || "未選択"}`;
      host
        .querySelectorAll<HTMLButtonElement>("button[data-city]")
        .forEach((button) => {
          const selected = route.includes(Number(button.dataset.city));
          button.setAttribute("aria-pressed", String(selected));
        });
    },
    dispose() {
      abort.abort();
      host.replaceChildren();
    },
  };
}
