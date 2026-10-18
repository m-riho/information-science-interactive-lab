import { transistorState, type TransistorMode } from "./model";
import type { Bit } from "../logic-gates/model";
/** 電気的な詳細を省略した理想スイッチ図。 */
export function transistorDiagram(
  mode: TransistorMode,
  a: Bit,
  b: Bit,
): string {
  const s = transistorState(mode, a, b);
  const wire = (d: string, on: boolean) =>
    `<path d="${d}" fill="none" stroke="${on ? "#4b286d" : "#a59aaa"}" stroke-width="${on ? 4 : 2}" ${on ? "" : 'stroke-dasharray="5 4"'}/>`;
  const sw = (index: number, x: number, y: number) => {
    const t = s.switches[index]!;
    return `${wire(`M${x} ${y - 32}V${y - 15} M${x} ${y + 15}V${y + 32}`, t.on)}${wire(`M${x} ${y - 15}L${t.on ? x : x + 22} ${y + 15}`, t.on)}<circle cx="${x}" cy="${y - 15}" r="3"/><circle cx="${x}" cy="${y + 15}" r="3"/><text x="${x + 30}" y="${y - 5}">${t.name} ${t.type}</text><text x="${x + 30}" y="${y + 17}">${t.input}=${t.input === "B" ? b : a}：${t.on ? "ON" : "OFF"}</text>`;
  };
  let drawing = "";
  if (mode === "mos")
    drawing = `${wire("M250 35V80 M250 120V178 M250 242V320", s.conducting)}<rect x="220" y="80" width="60" height="40" rx="8" fill="${s.conducting ? "#f2ecf7" : "white"}"/><text x="235" y="106">負荷</text>${sw(0, 250, 210)}<text x="50" y="155">${s.conducting ? "電流あり ↓" : "電流なし"}</text>`;
  else if (mode === "not")
    drawing = `${wire("M250 35V78 M250 142V218 M250 282V320", true)}${sw(0, 250, 110)}${sw(1, 250, 250)}${wire("M250 180H480", true)}<text x="400" y="167">出力=${s.output}</text>`;
  else
    drawing = `${wire("M250 35V55H130V78 M250 55H350V78 M130 142V175H350V142 M250 175V198 M250 262V278 M250 342V370", true)}${sw(0, 130, 110)}${sw(1, 350, 110)}${sw(2, 250, 230)}${sw(3, 250, 310)}${wire("M250 175H520", true)}<text x="440" y="163">出力=${s.output}</text><text x="35" y="225">上：並列</text><text x="35" y="260">下：直列</text>`;
  return `<svg viewBox="0 0 600 ${mode === "nand" ? 410 : 360}" role="img" aria-label="${mode === "mos" ? "負荷とnMOSを直列に接続" : mode === "not" ? "pMOSとnMOSによるCMOS NOT" : "上側pMOS2個は並列、下側nMOS2個は直列のCMOS NAND"}。${s.switches.map((t) => `${t.name} ${t.on ? "ON" : "OFF"}`).join("、")}"><g fill="#32184c" stroke="#8060a8">${drawing}</g><g fill="#32184c" font-size="18"><text x="210" y="25">電源（1）</text><text x="210" y="${mode === "nand" ? 400 : 350}">GND（0）</text></g></svg>`;
}
