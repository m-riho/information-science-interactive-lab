export interface CameraSettings {
  mode: "global" | "rolling";
  rps: number;
  /** 秒単位。読み出し開始から画像の末端境界までの時間。 */
  readout: number;
  exposure: number;
  direction: "down" | "up";
}
export function frameTime(time: number, fps: number): number {
  return Math.floor(time * fps + 1e-9) / fps;
}
export function rowTime(
  frame: number,
  row: number,
  height: number,
  settings: CameraSettings,
): number {
  if (settings.mode === "global") return frame;
  const scanRow = settings.direction === "down" ? row : height - 1 - row;
  return frame + (scanRow / height) * settings.readout;
}

/** 教育用の3枚羽プロペラ。露光区間の9つの中点で明るさを平均する。 */
export function renderPropeller(
  size: number,
  frame: number,
  settings: CameraSettings,
): Float32Array {
  const values = new Float32Array(size * size);
  const samples = settings.exposure === 0 ? 1 : 9;
  for (let row = 0; row < size; row++) {
    const start = rowTime(frame, row, size, settings);
    // 三角関数は行・露光サンプルごとに計算し、画素ループでは再利用する。
    const rotations = Array.from({ length: samples }, (_, sample) => {
      const time = start + ((sample + 0.5) / samples) * settings.exposure;
      return Array.from({ length: 3 }, (_, blade) => {
        const angle = 2 * Math.PI * (settings.rps * time + blade / 3);
        return { cos: Math.cos(angle), sin: Math.sin(angle) };
      });
    });
    const y = ((row + 0.5) / size) * 2 - 1;
    for (let column = 0; column < size; column++) {
      const x = ((column + 0.5) / size) * 2 - 1;
      const radius = x * x + y * y;
      if (radius < 0.018) {
        values[row * size + column] = 0.12;
        continue;
      }
      if (radius > 0.83 * 0.83) {
        values[row * size + column] = 1;
        continue;
      }
      let total = 0;
      for (const blades of rotations) {
        let brightness = 1;
        for (const { cos, sin } of blades) {
          const along = x * cos + y * sin;
          const across = -x * sin + y * cos;
          if (
            along > 0.06 &&
            along < 0.8 &&
            Math.abs(across) < 0.065 + 0.06 * along
          ) {
            brightness = 0.2;
            break;
          }
        }
        total += brightness;
      }
      values[row * size + column] = total / samples;
    }
  }
  return values;
}
