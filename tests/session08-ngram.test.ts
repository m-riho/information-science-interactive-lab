import { describe, expect, it } from "vitest";
import {
  DEFAULT_CORPUS, advanceGeneration, chooseCandidate, extractNgrams,
  initialGeneration, parseSentences, predict, trainNgram,
} from "../src/demos/ngram/model";

describe("単語単位のn-gram", () => {
  it.each([1, 2, 3, 4, 5])("n=%iの連続語を抽出する", n => {
    const words = ["今日", "は", "雨", "が", "降って", "います"];
    const grams = extractNgrams([words], n);
    expect(grams).toHaveLength(7 - n);
    expect(grams[0]?.words).toEqual(words.slice(0, n));
    expect(grams.at(-1)?.words).toEqual(words.slice(-n));
  });
  it("重複を集計し、行を越えず、短い文と空行を処理する", () => {
    expect(parseSentences(" a　b\r\n\n c\td ")).toEqual([["a", "b"], ["c", "d"]]);
    expect(extractNgrams(parseSentences("a b a b\na b\nc"), 2)).toEqual([
      { words: ["a", "b"], count: 3 }, { words: ["b", "a"], count: 1 },
    ]);
    expect(extractNgrams([["a"]], 3)).toEqual([]);
    expect(extractNgrams([], 1)).toEqual([]);
  });
  it("雨 が→降る2/3、強い1/3を実計算する", () => {
    const result = predict(trainNgram(DEFAULT_CORPUS, 3), ["雨", "が"]);
    expect(result.status).toBe("ready");
    expect(result.candidates).toEqual([
      { word: "降る", count: 2, probability: 2 / 3 },
      { word: "強い", count: 1, probability: 1 / 3 },
    ]);
  });
  it.each([1, 2, 3, 4, 5])("n=%iの全登録文脈の確率和は1", n => {
    const model = trainNgram(DEFAULT_CORPUS, n);
    for (const entry of model.contexts) {
      expect(predict(model, entry.words).candidates.reduce((sum, c) => sum + c.probability, 0)).toBeCloseTo(1);
    }
  });
  it("EOSは語と衝突せず、文末を含む頻度で正規化する", () => {
    const model = trainNgram("a b\na b c\n<EOS>", 2);
    expect(predict(model, ["b"]).candidates).toEqual([
      { word: null, count: 1, probability: .5 }, { word: "c", count: 1, probability: .5 },
    ]);
    expect(predict(model, ["<EOS>"]).candidates[0]?.word).toBe(null);
    expect(predict(trainNgram("a\nb", 1), []).candidates).toEqual([
      { word: "a", count: 1, probability: .25 },
      { word: null, count: 2, probability: .5 },
      { word: "b", count: 1, probability: .25 },
    ]);
  });
  it("未知・不足・空のデータを区別し0除算しない", () => {
    const model = trainNgram(DEFAULT_CORPUS, 3);
    expect(predict(model, ["未知", "語"]).status).toBe("unknown");
    expect(predict(model, ["雨"]).status).toBe("short-context");
    expect(predict(trainNgram("", 1), []).status).toBe("empty-corpus");
    expect(predict(model, ["未知", "語"]).candidates).toEqual([]);
  });
  it("最大確率、同率の先頭、サンプリング境界を扱う", () => {
    const candidates = predict(trainNgram(DEFAULT_CORPUS, 3), ["雨", "が"]).candidates;
    expect(chooseCandidate(candidates, "greedy", .99)?.word).toBe("降る");
    expect(chooseCandidate(candidates, "sampling", 0)?.word).toBe("降る");
    expect(chooseCandidate(candidates, "sampling", 2 / 3)?.word).toBe("強い");
    expect(chooseCandidate(candidates, "sampling", .99999)?.word).toBe("強い");
    expect(chooseCandidate([], "greedy", 0)).toBeUndefined();
    const tied = predict(trainNgram("a b\na c", 2), ["a"]).candidates;
    expect(chooseCandidate(tied, "greedy", 0)?.word).toBe("b");
    const counts = Array.from({ length: 3000 }, (_, i) => chooseCandidate(candidates, "sampling", (i + .5) / 3000)?.word);
    expect(counts.filter(word => word === "降る")).toHaveLength(2000);
  });
  it("実際の頻度から生成しEOSで停止、入力は変更しない", () => {
    const model = trainNgram(DEFAULT_CORPUS, 3);
    const initial = initialGeneration("今日 は 雨 が", model);
    const first = advanceGeneration(initial, model, "greedy", 0);
    expect(first.words).toEqual(["今日", "は", "雨", "が", "降る"]);
    expect(initial.words).toHaveLength(4);
    const ended = advanceGeneration(first, model, "greedy", 0);
    expect(ended.reason).toBe("eos");
    expect(ended.words).toEqual(first.words);
    expect(advanceGeneration(ended, model, "greedy", 0)).toBe(ended);
    expect(initialGeneration("今日 は 雨 が", model)).toEqual(initial);
  });
  it("開始文込み30単語で循環を停止し、長すぎる開始文を拒否する", () => {
    const model = trainNgram("a a a a", 2);
    let state = initialGeneration("a", model);
    for (let i = 0; i < 50; i++) state = advanceGeneration(state, model, "greedy", 0);
    expect(state.words).toHaveLength(30);
    expect(state.reason).toBe("limit");
    expect(state.history).toHaveLength(29);
    expect(initialGeneration(Array(31).fill("a").join(" "), model).reason).toBe("start-too-long");
    expect(initialGeneration("x", model).reason).toBe("unknown");
    expect(initialGeneration("", model).reason).toBe("short-context");
  });
  it.each([0, 6, 1.5, NaN])("無効なn=%sを拒否する", n => {
    expect(() => trainNgram(DEFAULT_CORPUS, n)).toThrow();
    expect(() => extractNgrams([], n)).toThrow();
  });
});
