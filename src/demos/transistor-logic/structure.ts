import type { Bit } from "../logic-gates/model";

/** nMOS断面の概念図。円は電子ではなく慣用的な電流の向き。 */
export function nmosStructure(gate: Bit): string {
  return `<h3>nMOSの中を見てみよう</h3>
  <div class="mos-scroll" tabindex="0" role="region" aria-label="nMOS断面図。狭い画面では横にスクロールできます。"><svg class="mos-structure" viewBox="0 0 600 350" role="img" aria-label="P型基板の中にN型SourceとDrain。Gate=${gate}、${gate ? "チャネルができて電流がDrainからSourceへ流れる" : "チャネルがなく電流は流れない"}">
    <rect class="mos-body" x="60" y="200" width="480" height="125" rx="8"/>
    <text x="300" y="300" text-anchor="middle">P型基板</text>
    <rect class="mos-n" x="100" y="200" width="100" height="60"/>
    <rect class="mos-n" x="400" y="200" width="100" height="60"/>
    <text x="150" y="245" text-anchor="middle">N型</text><text x="450" y="245" text-anchor="middle">N型</text>
    <path class="mos-wire" d="M150 200V115 M450 200V115 M300 160V100"/>
    <text x="150" y="85" text-anchor="middle">Source</text><text x="150" y="108" text-anchor="middle">GND（0V）</text>
    <text x="450" y="85" text-anchor="middle">Drain</text><text x="450" y="108" text-anchor="middle">負荷を介して電源へ</text>
    <rect class="mos-gate" x="210" y="160" width="180" height="25"/>
    <text x="300" y="85" text-anchor="middle">Gate = ${gate}</text>
    <rect class="mos-insulator" x="200" y="185" width="200" height="15"/>
    <text x="80" y="176">絶縁膜 →</text>
    ${gate ? '<path class="mos-channel" d="M200 212H400"/><text x="300" y="265" text-anchor="middle">チャネル（通り道）</text>' : '<text x="300" y="240" text-anchor="middle">通り道なし</text>'}
    ${gate ? Array.from({ length: 6 }, (_, i) => `<circle class="mos-charge" cx="440" cy="212" r="5" style="animation-delay:-${i / 3}s"/>`).join("") : ""}
    <text x="300" y="335" text-anchor="middle">${gate ? "ON：電流の向き Drain → Source" : "OFF：電流は流れません"}</text>
  </svg></div>
  <p class="hint">断面を単純化した模式図です。Gateの電圧で絶縁膜の下にチャネルができ、DrainとSourceがつながります。小さな円は電流の向きを表す記号で、実際の電子の動き（逆向き）や速さを再現するものではありません。Gateから絶縁膜を通る電流は描いていません。</p>`;
}
