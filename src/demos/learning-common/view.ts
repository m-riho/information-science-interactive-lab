import type { Point } from "./model";
export const svg = (body: string, title: string) =>
  `<svg class="ml-plot" viewBox="0 0 440 330" role="img" aria-label="${title}">${body}</svg>`;
export const sx = (x: number) => 40 + 360 * x,
  sy = (y: number) => 285 - 240 * y;
export const axes =
  '<path d="M40 30V285H410" fill="none" stroke="currentColor"/><text x="410" y="310">x</text><text x="15" y="25">y</text><text x="32" y="310">0</text><text x="390" y="310">1</text><text x="18" y="50">1</text>';
export const dot = (p: Point, label: string, fill = "var(--brand)") =>
  `<circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="6" fill="${fill}"/><text x="${sx(p.x) + 9}" y="${sy(p.y) - 7}">${label}</text>`;
export const field = (
  label: string,
  id: string,
  min: number,
  max: number,
  step: number,
  value: number,
) =>
  `<label class="per-slider" for="${id}">${label}<output for="${id}"></output><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
export function numbers(host: HTMLElement) {
  host.querySelectorAll<HTMLOutputElement>("output[for]").forEach((o) => {
    const input = host.querySelector<HTMLInputElement>("#" + o.htmlFor.value);
    if (input) o.value = input.value;
  });
}
