import { describe, expect, it } from "vitest";
import { searchDocuments, prepareAnswer, verifyAnswer, advanceRagStage } from "../src/demos/rag/model";
import { trainingPair, allTrainingPairs, teachingUnits } from "../src/demos/self-supervised/model";
import { distance, initialPoints, movePoint } from "../src/demos/embedding/model";

describe("RAGの資料検索と検証", () => {
  it("全資料では新旧両方、最新版では新しい月曜案内を検索する", () => {
    expect(searchDocuments("monday", "all").map(d => d.id)).toEqual(["B", "D"]);
    expect(searchDocuments("monday", "latest").map(d => d.id)).toEqual(["D"]);
    expect(searchDocuments("monday", "old").map(d => d.id)).toEqual(["B"]);
  });
  it("検索0件では出典や断定した回答を作らない", () => {
    const docs = searchDocuments("parking", "all");
    const answer = prepareAnswer("parking", docs, "careful");
    expect(docs).toEqual([]);
    expect(answer.evidence).toEqual([]);
    expect(verifyAnswer("parking", docs, answer).unsupported).toBe(true);
  });
  it("古い回答と新旧の不一致を別々に検出する", () => {
    const old = searchDocuments("monday", "old");
    expect(verifyAnswer("monday", old, prepareAnswer("monday", old, "careful"))).toMatchObject({ stale: true, conflict: false });
    const all = searchDocuments("monday", "all");
    expect(verifyAnswer("monday", all, prepareAnswer("monday", all, "careful"))).toMatchObject({ stale: false, conflict: true, misread: false });
  });
  it("最新資料があっても読み違いを検出し、試験期間の条件を検証する", () => {
    const monday = searchDocuments("monday", "latest");
    expect(verifyAnswer("monday", monday, prepareAnswer("monday", monday, "misread")).misread).toBe(true);
    const exam = searchDocuments("exam", "latest");
    expect(verifyAnswer("exam", exam, prepareAnswer("exam", exam, "misread")).misread).toBe(true);
    expect(verifyAnswer("exam", exam, prepareAnswer("exam", exam, "careful")).misread).toBe(false);
  });
  it("照合完了からは先に進めない", () => {
    expect(advanceRagStage(0)).toBe(1);
    expect(advanceRagStage(6)).toBe(6);
  });
});

describe("自己教師あり学習の入力と次の正解", () => {
  it("指定境界の前だけを入力にし、次の一単位だけを正解にする", () => {
    expect(trainingPair(teachingUnits, 4)).toEqual({ input: ["今日", "は", "雨", "なので"], target: "傘", position: 4 });
  });
  it("全位置でも正解以後を入力へ漏らさず、元の配列を変えない", () => {
    const units = ["A", "B", "C"];
    expect(allTrainingPairs(units)).toEqual([
      { input: ["A"], target: "B", position: 1 },
      { input: ["A", "B"], target: "C", position: 2 },
    ]);
    expect(units).toEqual(["A", "B", "C"]);
    expect(allTrainingPairs([])).toEqual([]);
  });
  it.each([0, -1, 10, 1.5, NaN])("不正な予測位置 %s を拒否する", position => {
    expect(() => trainingPair(teachingUnits, position)).toThrow(RangeError);
  });
});

describe("模式Embeddingの距離と移動", () => {
  it("ユークリッド距離を計算し、同一点では0になる", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(distance({ x: -3, y: 4 }, { x: -3, y: 4 })).toBe(0);
  });
  it("点を不変更新し、表示範囲へ制限する", () => {
    const points = initialPoints();
    const moved = movePoint(points, "cat", 200, -200);
    expect(moved.find(p => p.id === "cat")).toMatchObject({ x: 10, y: 0 });
    expect(points.find(p => p.id === "cat")).toMatchObject({ x: 2, y: 7 });
    expect(movePoint(moved, "cat", 3, 4).find(p => p.id === "cat")).toMatchObject({ x: 3, y: 4 });
  });
  it("非有限数では点を壊さない", () => {
    const points = initialPoints();
    expect(movePoint(points, "cat", NaN, 4)).toEqual(points);
    expect(movePoint(points, "cat", 3, Infinity)).toEqual(points);
  });
});
