export interface Vector2 { readonly x: number; readonly y: number }
export interface WordPoint extends Vector2 { readonly id: string; readonly label: string }
export function initialPoints(): WordPoint[] {
  return [{ id: "cat", label: "猫", x: 2, y: 7 }, { id: "dog", label: "犬", x: 3, y: 8 }, { id: "table", label: "机", x: 7, y: 2 }, { id: "chair", label: "椅子", x: 8, y: 3 }];
}
export function distance(a: Vector2, b: Vector2): number { return Math.hypot(a.x - b.x, a.y - b.y); }
export function movePoint(points: readonly WordPoint[], id: string, x: number, y: number): WordPoint[] {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return [...points];
  const clamp = (value: number) => Math.round(Math.max(0, Math.min(10, value)) * 10) / 10;
  return points.map(point => point.id === id ? { ...point, x: clamp(x), y: clamp(y) } : point);
}
