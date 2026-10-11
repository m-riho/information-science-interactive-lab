/** マークが1回転で同じ姿に戻る場合。境界は負側へ折り返す。 */
export function apparentRps(rps: number, fps: number): number {
  return rps - fps * Math.floor(rps / fps + 0.5);
}
export function angleAt(rps: number, time: number): number {
  const turns = rps * time;
  return (((turns % 1) + 1) % 1) * 2 * Math.PI;
}
/** 浮動小数点の丸めで、撮影境界を1コマ前と判定しない。 */
export function sampleTime(time: number, fps: number): number {
  return Math.floor(time * fps + 1e-9) / fps;
}
export function nextFrameTime(time: number, fps: number): number {
  return (Math.floor(time * fps + 1e-9) + 1) / fps;
}
