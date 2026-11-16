export function matrix(spam: number, detection: number, falseAlarm: number) {
  if (
    ![spam, detection, falseAlarm].every(
      (x) => Number.isFinite(x) && x >= 0 && x <= 1,
    )
  )
    throw new RangeError("割合は0〜1");
  const positive = Math.round(spam * 1000),
    negative = 1000 - positive,
    tp = Math.round(positive * detection),
    fp = Math.round(negative * falseAlarm),
    fn = positive - tp,
    tn = negative - fp;
  return {
    tp,
    fp,
    fn,
    tn,
    accuracy: (tp + tn) / 1000,
    precision: tp + fp ? tp / (tp + fp) : null,
    recall: positive ? tp / positive : null,
  };
}
