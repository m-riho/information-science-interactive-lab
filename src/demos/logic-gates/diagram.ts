import type p5 from "p5";
import {
  evaluateGate,
  nandCircuit,
  type Bit,
  type Gate,
  type NandTarget,
} from "./model";
type Point = [number, number];
export function drawCircuit(
  p: p5,
  gate: Gate,
  a: Bit,
  b: Bit,
  nand: boolean,
  stage: number,
): void {
  const w = p.width;
  const wire = (points: Point[], value: Bit | undefined) => {
    const ctx = p.drawingContext as CanvasRenderingContext2D;
    p.noFill();
    p.stroke(value === 1 ? "#4B286D" : "#81788a");
    p.strokeWeight(value === 1 ? 3 : 1.5);
    ctx.setLineDash(value === 1 ? [] : [4, 4]);
    p.beginShape();
    for (const [x, y] of points) p.vertex(x, y);
    p.endShape();
    ctx.setLineDash([]);
  };
  const label = (text: string, x: number, y: number) => {
    p.noStroke();
    p.fill("#32184C");
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(text, x, y);
  };
  const node = (x: number, y: number, name: string, id?: string) => {
    p.fill("#F2ECF7");
    p.stroke("#8060A8");
    p.strokeWeight(1);
    p.rect(x - 34, y - 30, 68, 60, 8);
    label(name, x, y);
    if (id) label(id, x, y - 42);
  };
  const input = (name: string, value: Bit, y: number) => {
    label(`${name}=${value}`, 24, y - 22);
    p.fill(value ? "#4B286D" : "#FFFFFF");
    p.stroke("#4B286D");
    p.circle(24, y, 9);
  };
  const end = (x: number, y: number, value: Bit | undefined) => {
    p.fill(value === 1 ? "#4B286D" : "#FFFFFF");
    p.stroke("#4B286D");
    p.circle(x, y, 14);
    label(value === undefined ? "?" : String(value), x, y + 22);
  };
  p.background("#FFFFFF");
  if (!nand) {
    const x = w / 2,
      y = 160;
    node(x, y, gate);
    input("A", a, gate === "NOT" ? 160 : 110);
    wire(
      [
        [24, gate === "NOT" ? 160 : 110],
        [x - 49, gate === "NOT" ? 160 : 110],
        [x - 49, gate === "NOT" ? 160 : 147],
        [x - 34, gate === "NOT" ? 160 : 147],
      ],
      a,
    );
    if (gate !== "NOT") {
      input("B", b, 210);
      wire(
        [
          [24, 210],
          [x - 49, 210],
          [x - 49, 173],
          [x - 34, 173],
        ],
        b,
      );
    }
    const out = evaluateGate(gate, a, b);
    wire(
      [
        [x + 34, y],
        [w - 24, y],
      ],
      out,
    );
    end(w - 24, y, out);
    return;
  }
  const steps = nandCircuit(gate as NandTarget, a, b),
    value = (i: number): Bit | undefined =>
      stage > i ? steps[i]?.output : undefined;
  const tied = (x: number, y: number, start: Point, v: Bit | undefined) => {
    wire([start, [x - 48, start[1]], [x - 48, y]], v);
    wire(
      [
        [x - 48, y],
        [x - 48, y - 13],
        [x - 34, y - 13],
      ],
      v,
    );
    wire(
      [
        [x - 48, y],
        [x - 48, y + 13],
        [x - 34, y + 13],
      ],
      v,
    );
  };
  if (gate === "NOT") {
    const x = w * 0.52;
    input("A", a, 160);
    tied(x, 160, [24, 160], a);
    node(x, 160, "NAND", "N1");
    wire(
      [
        [x + 34, 160],
        [w - 24, 160],
      ],
      value(0),
    );
    end(w - 24, 160, value(0));
  } else if (gate === "AND") {
    const x = w * 0.34,
      z = w * 0.71;
    input("A", a, 95);
    input("B", b, 225);
    wire(
      [
        [24, 95],
        [x - 44, 95],
        [x - 44, 147],
        [x - 34, 147],
      ],
      a,
    );
    wire(
      [
        [24, 225],
        [x - 44, 225],
        [x - 44, 173],
        [x - 34, 173],
      ],
      b,
    );
    node(x, 160, "NAND", "N1");
    tied(z, 160, [x + 34, 160], value(0));
    label(`N1=${value(0) ?? "?"}`, (x + z) / 2, 207);
    node(z, 160, "NAND", "N2");
    wire(
      [
        [z + 34, 160],
        [w - 24, 160],
      ],
      value(1),
    );
    end(w - 24, 160, value(1));
  } else {
    const x = w * 0.34,
      z = w * 0.71;
    input("A", a, 95);
    input("B", b, 225);
    tied(x, 95, [24, 95], a);
    tied(x, 225, [24, 225], b);
    node(x, 95, "NAND", "N1");
    node(x, 225, "NAND", "N2");
    wire(
      [
        [x + 34, 95],
        [z - 44, 95],
        [z - 44, 147],
        [z - 34, 147],
      ],
      value(0),
    );
    wire(
      [
        [x + 34, 225],
        [z - 44, 225],
        [z - 44, 173],
        [z - 34, 173],
      ],
      value(1),
    );
    label(`N1=${value(0) ?? "?"}`, (x + z) / 2, 68);
    label(`N2=${value(1) ?? "?"}`, (x + z) / 2, 252);
    node(z, 160, "NAND", "N3");
    wire(
      [
        [z + 34, 160],
        [w - 24, 160],
      ],
      value(2),
    );
    end(w - 24, 160, value(2));
  }
}
/** 直列・並列スイッチの概念図。実際のトランジスタ回路ではない。 */
export function switchDiagram(gate: "AND" | "OR", a: Bit, b: Bit): string {
  const sw = (x: number, y: number, name: string, v: Bit) =>
    `<text x="${x + 20}" y="${y - 20}" text-anchor="middle">${name}=${v}</text><circle cx="${x}" cy="${y}" r="3"/><circle cx="${x + 40}" cy="${y}" r="3"/><path d="M${x},${y} L${x + 40},${v ? y : y - 14}"/>`;
  const out = evaluateGate(gate, a, b);
  return `<svg viewBox="0 0 360 150" role="img" aria-label="${gate === "AND" ? "直列" : "並列"}スイッチ：A=${a}、B=${b}、ランプ${out === 1 ? "点灯" : "消灯"}"><g fill="none" stroke="#4B286D" stroke-width="2">${gate === "AND" ? `<path d="M30 80H95 M135 80H205 M245 80H310"/>${sw(95, 80, "A", a)}${sw(205, 80, "B", b)}` : `<path d="M30 80H85 V50H150 M85 80V110H150 M190 50H270V110H190 M270 80H310"/>${sw(150, 50, "A", a)}${sw(150, 110, "B", b)}`}<circle cx="325" cy="80" r="14" fill="${out ? "#4B286D" : "#FFFFFF"}"/></g><g fill="#32184C" font-size="12"><text x="8" y="108">電源</text><text x="298" y="115">${out ? "点灯" : "消灯"}</text></g></svg>`;
}
