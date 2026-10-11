export type Pattern = "stripes" | "grid" | "diagonal" | "rings";
export interface SamplingOptions {
  pattern: Pattern;
  frequency: number;
  phase: number;
  resolution: number;
}

/** x,yは画像の幅・高さを1とする連続座標。明るさは0〜1。 */
export function patternValue(
  pattern: Pattern,
  x: number,
  y: number,
  frequency: number,
  phase: number,
): number {
  const wave = (position: number) =>
    Math.cos(2 * Math.PI * (frequency * position + phase));
  switch (pattern) {
    case "stripes":
      return 0.5 + 0.5 * wave(x);
    case "grid":
      return 0.5 + 0.25 * (wave(x) + wave(y));
    case "diagonal":
      return 0.5 + 0.5 * wave((x + y) / Math.SQRT2);
    case "rings":
      return 0.5 + 0.5 * wave(Math.hypot(x - 0.5, y - 0.5));
  }
}

export function makeReference(
  options: SamplingOptions,
  size: number,
): Float32Array {
  const values = new Float32Array(size * size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      values[y * size + x] = patternValue(
        options.pattern,
        (x + 0.5) / size,
        (y + 0.5) / size,
        options.frequency,
        options.phase,
      );
    }
  return values;
}

/** 縦横の移動平均を3回適用。ガウス状のローパス近似（理想フィルタではない）。 */
export function lowPass(
  source: Float32Array,
  size: number,
  resolution: number,
): Float32Array {
  const radius = Math.max(1, Math.round((0.6 * size) / resolution));
  let values = source.slice();
  for (let pass = 0; pass < 3; pass++) {
    values = boxBlur(boxBlur(values, size, radius, false), size, radius, true);
  }
  return values;
}

function boxBlur(
  source: Float32Array,
  size: number,
  radius: number,
  vertical: boolean,
): Float32Array<ArrayBuffer> {
  const result = new Float32Array(size * size);
  const index = (line: number, position: number) => {
    const clamped = Math.max(0, Math.min(size - 1, position));
    return vertical ? clamped * size + line : line * size + clamped;
  };
  for (let line = 0; line < size; line++) {
    let sum = 0;
    for (let k = -radius; k <= radius; k++) sum += source[index(line, k)]!;
    for (let position = 0; position < size; position++) {
      result[index(line, position)] = sum / (2 * radius + 1);
      sum +=
        source[index(line, position + radius + 1)]! -
        source[index(line, position - radius)]!;
    }
  }
  return result;
}

/** フィルタなしは解析式を直接標本化。ありはフィルタ済み内部画像を読み取る。 */
export function samplePattern(
  options: SamplingOptions,
  filtered?: Float32Array,
  sourceSize = 512,
): Float32Array {
  const n = options.resolution;
  const samples = new Float32Array(n * n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const u = (x + 0.5) / n;
      const v = (y + 0.5) / n;
      if (!filtered) {
        samples[y * n + x] = patternValue(
          options.pattern,
          u,
          v,
          options.frequency,
          options.phase,
        );
      } else {
        // 内部ラスタの画素中心から双線形で読み取る。表示時の補間とは別工程。
        const sx = Math.max(0, Math.min(sourceSize - 1, u * sourceSize - 0.5));
        const sy = Math.max(0, Math.min(sourceSize - 1, v * sourceSize - 0.5));
        const x0 = Math.floor(sx),
          y0 = Math.floor(sy);
        const x1 = Math.min(x0 + 1, sourceSize - 1),
          y1 = Math.min(y0 + 1, sourceSize - 1);
        const dx = sx - x0,
          dy = sy - y0;
        const top =
          filtered[y0 * sourceSize + x0]! * (1 - dx) +
          filtered[y0 * sourceSize + x1]! * dx;
        const bottom =
          filtered[y1 * sourceSize + x0]! * (1 - dx) +
          filtered[y1 * sourceSize + x1]! * dx;
        samples[y * n + x] = top * (1 - dy) + bottom * dy;
      }
    }
  return samples;
}
