// A tight crop fits inside 20×20. Its centre of mass is then moved to the
// centre of the 28×28 image, using the same foreground polarity as MNIST.
function normalizeInk(canvas: HTMLCanvasElement): Float32Array | null {
  const size = canvas.width;
  const rgba = canvas.getContext("2d")!.getImageData(0, 0, size, size).data;
  let left = size, top = size, right = -1, bottom = -1;
  for (let i = 0; i < size * size; i++) {
    if (rgba[i * 4]! < 10) continue;
    const x = i % size, y = Math.floor(i / size);
    left = Math.min(left, x); right = Math.max(right, x);
    top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  if (right < left) return null;
  const width = right - left + 1, height = bottom - top + 1;
  const scale = 20 / Math.max(width, height);
  const small = document.createElement("canvas");
  small.width = small.height = 28;
  const ctx = small.getContext("2d")!;
  ctx.fillStyle = "black"; ctx.fillRect(0, 0, 28, 28);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(canvas, left, top, width, height,
    (28 - width * scale) / 2, (28 - height * scale) / 2, width * scale, height * scale);
  const pixels = ctx.getImageData(0, 0, 28, 28).data;
  let mass = 0, mx = 0, my = 0;
  for (let i = 0; i < 784; i++) {
    const v = pixels[4 * i]!;
    mass += v; mx += v * (i % 28); my += v * Math.floor(i / 28);
  }
  if (!mass) return null;
  const dx = Math.round(13.5 - mx / mass), dy = Math.round(13.5 - my / mass);
  const out = new Float32Array(784);
  for (let i = 0; i < 784; i++) {
    const x = i % 28 + dx, y = Math.floor(i / 28) + dy;
    if (x >= 0 && x < 28 && y >= 0 && y < 28) out[y * 28 + x] = pixels[4 * i]! / 255;
  }
  return out;
}

export function mountPad(host: HTMLElement, signal: AbortSignal, onEdit: () => void) {
  host.innerHTML = `<div class="digit-canvases"><div><label>手書き入力</label><canvas data-ink width="196" height="196" aria-label="白い線で数字を描く入力欄"></canvas></div><div><label>モデルへの入力（28×28）</label><canvas data-preview width="28" height="28" aria-label="前処理後の画像"></canvas></div></div>
    <div class="transport"><button data-clear>クリア</button><button data-example>テスト画像を使う</button><button data-predict>判定する</button></div><p data-result role="status"></p>`;
  const canvas = host.querySelector<HTMLCanvasElement>("[data-ink]")!;
  const preview = host.querySelector<HTMLCanvasElement>("[data-preview]")!;
  const ctx = canvas.getContext("2d")!, mini = preview.getContext("2d")!;
  let input: Float32Array | null = null;
  function show(image: Float32Array | null) {
    input = image;
    const frame = mini.createImageData(28, 28);
    for (let i = 0; i < 784; i++) {
      const v = Math.round(255 * (image?.[i] ?? 0));
      frame.data.set([v, v, v, 255], 4 * i);
    }
    mini.putImageData(frame, 0, 0);
    onEdit();
  }
  function clear() {
    ctx.fillStyle = "black"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    show(null);
  }
  clear();
  const position = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) * canvas.width / r.width, (e.clientY - r.top) * canvas.height / r.height] as const;
  };
  let pointer: number | null = null;
  canvas.addEventListener("pointerdown", e => {
    if (pointer !== null) return;
    pointer = e.pointerId; canvas.setPointerCapture(pointer);
    const [x, y] = position(e);
    ctx.fillStyle = ctx.strokeStyle = "white"; ctx.lineWidth = 13; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(x, y, 6.5, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, y); show(normalizeInk(canvas));
  }, { signal });
  canvas.addEventListener("pointermove", e => {
    if (pointer !== e.pointerId) return;
    const [x, y] = position(e); ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y);
    show(normalizeInk(canvas));
  }, { signal });
  canvas.addEventListener("lostpointercapture", () => { pointer = null; }, { signal });
  host.querySelector("[data-clear]")!.addEventListener("click", clear, { signal });
  return { read: () => input, clear, example(image: Float32Array) {
    show(image);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);
  } };
}
