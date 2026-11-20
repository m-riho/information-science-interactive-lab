/** 実際のトークナイザを使用しない、単語・語句による模式的分割。 */
export const teachingUnits: readonly string[] = ["今日", "は", "雨", "なので", "傘", "を", "持って", "出かけ", "ます", "。"];
export interface TrainingPair { input: string[]; target: string; position: number }
export function trainingPair(units: readonly string[], position: number): TrainingPair {
  if (!Number.isInteger(position) || position < 1 || position >= units.length) throw new RangeError("予測位置は1以上、単位数未満の整数です");
  return { input: units.slice(0, position), target: units[position]!, position };
}
/** 文頭の特殊記号を省き、1単位以上の入力がある全境界を扱う。 */
export function allTrainingPairs(units: readonly string[]): TrainingPair[] {
  return units.slice(1).map((_, index) => trainingPair(units, index + 1));
}
