import { extrema, quartic, type DescentPoint } from "./model";

const left = 60, right = 410, top = 28, bottom = 248;

export function formatNumber(value: number, digits = 5) {
  return String(Number(value.toPrecision(digits)));
}

function axisLabel(value: number) {
  return Math.abs(value) >= 10000 ? value.toExponential(0) : formatNumber(value, 4);
}

export function mountDescentChart(svg: SVGSVGElement) {
  let extent = 0;
  let ymax = 0;
  const sx = (x: number) => left + (x + extent) / (2 * extent) * (right - left);
  const sy = (y: number) => top + (1.05 - y / ymax) / 1.2 * (bottom - top);
  const coord = (p: DescentPoint) => `${sx(p.x).toFixed(2)},${sy(p.value).toFixed(2)}`;

  function drawAxes() {
    const ticks = [-1, -0.5, 0, 0.5, 1].map(fraction => {
      const x = fraction * extent;
      return `<path d="M${sx(x)} ${top}V${bottom}" stroke="var(--border)"/><text x="${sx(x)}" y="${bottom + 20}" text-anchor="middle">${axisLabel(x)}</text>`;
    });
    for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
      const y = fraction * ymax;
      ticks.push(`<path d="M${left} ${sy(y)}H${right}" stroke="var(--border)"/><text x="${left - 7}" y="${sy(y) + 4}" text-anchor="end">${axisLabel(y)}</text>`);
    }
    const curve = Array.from({ length: 301 }, (_, i) => {
      const x = -extent + 2 * extent * i / 300;
      return `${sx(x).toFixed(2)},${sy(quartic(x)).toFixed(2)}`;
    });
    const markers = extrema.map(p => {
      const shape = p.kind === "minimum" ? "M0 -5l5 5 -5 5 -5 -5z" : "M0 -6l6 10h-12z";
      return `<path transform="translate(${coord(p)})" d="${shape}" fill="white" stroke="var(--brand)" stroke-width="2.5"/>`;
    }).join("");
    svg.innerHTML = `${ticks.join("")}<path d="M${left} ${top}V${bottom}H${right}" fill="none" stroke="currentColor"/>
      <text x="${left - 9}" y="17" text-anchor="end">f(x)</text><text x="${right + 13}" y="${bottom + 20}">x</text>
      <polyline points="${curve.join(" ")}" fill="none" stroke="var(--brand)" stroke-width="3"/>
      <defs><clipPath id="descent-tangent-clip"><rect x="${left}" y="${top}" width="${right - left}" height="${bottom - top}"/></clipPath></defs>
      <line data-tangent x1="${left}" x2="${right}" stroke="#a44812" stroke-width="2.5" stroke-dasharray="10 3 2 3" clip-path="url(#descent-tangent-clip)"/>
      <g data-trail></g>${markers}<circle data-current r="8" fill="none" stroke="var(--text)" stroke-width="3.5"/>`;
  }

  function render(points: readonly DescentPoint[], index: number) {
    const history = points.slice(0, index + 1);
    const current = points[index]!;
    const needed = Math.max(2, ...history.map(p => Math.ceil(2 * Math.abs(p.x)) / 2));
    if (extent !== needed) {
      extent = needed;
      ymax = extent === 2 ? 8 : Math.ceil(quartic(extent));
      drawAxes();
    }
    // Project the tangent through the same data-to-screen transform as the curve.
    const tangent = svg.querySelector<SVGLineElement>("[data-tangent]")!;
    const tangentY = (x: number) => current.value + current.slope * (x - current.x);
    tangent.setAttribute("y1", String(sy(tangentY(-extent))));
    tangent.setAttribute("y2", String(sy(tangentY(extent))));
    svg.setAttribute("aria-label", `関数と探索の履歴。横軸 x は−${extent}から${extent}。現在の x は${formatNumber(current.x)}、f(x) は${formatNumber(current.value)}、接線の傾きは${formatNumber(current.slope)}。`);
    const trail = svg.querySelector<SVGGElement>("[data-trail]")!;
    trail.innerHTML = `<polyline points="${history.map(coord).join(" ")}" fill="none" stroke="var(--accent)" stroke-dasharray="5 4" stroke-width="2"/>
      ${history.slice(-24, -1).map(p => `<circle cx="${sx(p.x)}" cy="${sy(p.value)}" r="3" fill="var(--accent)"/>`).join("")}`;
    const marker = svg.querySelector<SVGCircleElement>("[data-current]")!;
    marker.setAttribute("cx", String(sx(current.x)));
    marker.setAttribute("cy", String(sy(current.value)));
  }

  function xAt(event: MouseEvent) {
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    if (p.x < left || p.x > right || p.y < top || p.y > bottom) return null;
    return ((p.x - left) / (right - left) * 2 - 1) * extent;
  }
  return { render, xAt };
}
