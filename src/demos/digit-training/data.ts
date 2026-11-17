export interface DigitSplit {
  /** 28 × 28 pixels per image, row-major; black = 0, white = 255. */
  pixels: Uint8Array;
  /** Original MNIST digits, before converting 1 vs. all others. */
  labels: Uint8Array;
}

export interface DigitDataset {
  train: DigitSplit;
  test: DigitSplit;
}

const directory = import.meta.env.BASE_URL + "data/session07-digits/";

async function readAsset(filename: string, signal: AbortSignal): Promise<ArrayBuffer> {
  const response = await fetch(directory + filename, { signal });
  if (!response.ok) throw new Error(`教材データを取得できませんでした（${response.status}）。`);
  return response.arrayBuffer();
}

async function readSplit(name: string, count: number, signal: AbortSignal): Promise<DigitSplit> {
  const buffer = await readAsset(name + ".bin", signal);
  if (buffer.byteLength !== count * (1 + 784)) {
    throw new Error("数字画像データのサイズが一致しません。");
  }
  const labels = new Uint8Array(buffer, 0, count);
  if (labels.some(label => label > 9)) throw new Error("数字ラベルの範囲が正しくありません。");
  return { pixels: new Uint8Array(buffer, count), labels };
}

export async function loadDigits(signal: AbortSignal): Promise<DigitDataset> {
  const [train, test] = await Promise.all([
    readSplit("train", 2000, signal),
    readSplit("test", 500, signal),
  ]);
  return { train, test };
}

export async function loadPretrained(signal: AbortSignal): Promise<Float32Array> {
  const buffer = await readAsset("pretrained.f32", signal);
  const count = 784 * 32 + 32 + 32 + 1;
  if (buffer.byteLength !== count * 4) throw new Error("学習済み重みのサイズが一致しません。");
  const view = new DataView(buffer);
  const weights = Float32Array.from({ length: count }, (_, i) => view.getFloat32(i * 4, true));
  if (weights.some(value => !Number.isFinite(value))) throw new Error("学習済み重みに異常があります。");
  return weights;
}
