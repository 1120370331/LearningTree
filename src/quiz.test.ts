import { describe, expect, it } from "vitest";
import { demoData } from "./demo";
import { parseData, type QuizQuestion } from "./domain";
import { evidence, newlyUnlocked, skillState } from "./progression";
import {
  gradeQuiz,
  assessmentPoints,
  questionPoints,
  manualAssessmentComplete,
} from "./quiz";

const now = new Date("2026-10-22T10:00:00.000Z");
describe("question numbering and points", () => {
  it("defaults old questions to one point and persists their original numbers and points", () => {
    const data = demoData(now);
    const node = data.nodes.find((n) => n.id === "css")!;
    const session = gradeQuiz(
      node.id,
      node.quiz,
      node.quiz.map((q) => q.correctIndex),
      5,
      3,
      now,
    );
    expect(
      session.quizAnswers?.map((answer) => [
        answer.questionNumber,
        answer.points,
      ]),
    ).toEqual([
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 1],
    ]);
    expect(assessmentPoints(session.quizAnswers!)).toEqual({
      earned: 5,
      total: 5,
    });
    const restored = parseData(
      JSON.parse(
        JSON.stringify({ ...data, sessions: [...data.sessions, session] }),
      ),
    );
    expect(restored.sessions.at(-1)?.quizAnswers).toEqual(session.quizAnswers);
  });
  it("totals configured points separately from subjective self-assessment and correctness counts", () => {
    const data = demoData(now);
    const node = data.nodes.find((n) => n.id === "css")!;
    const base = node.quiz[0];
    const questions: QuizQuestion[] = [
      { ...base, id: "worth-three", points: 3 },
      { ...base, id: "worth-five", points: 5 },
      {
        ...base,
        id: "self-seven",
        type: "short_answer",
        points: 7,
        referenceAnswer: "说明选择依据并给出例子。",
        rubric: ["解释选择依据", "给出有效例子"],
      },
    ];
    const session = gradeQuiz(
      node.id,
      questions,
      [
        base.correctIndex,
        (base.correctIndex + 1) % base.options.length,
        "我的解释与例子",
      ],
      5,
      3,
      now,
      { "self-seven": { reviewed: true, met: [true, true], score: 7 } },
    );
    expect(assessmentPoints(session.quizAnswers!)).toEqual({
      earned: 3,
      total: 8,
    });
    expect(assessmentPoints(session.quizAnswers!, "self")).toEqual({
      earned: 7,
      total: 7,
    });
    expect(session.correct).toBe(1);
    expect(session.total).toBe(2);
    expect(session.quizAnswers?.[2].questionNumber).toBe(3);
    questions[0].points = 100;
    expect(session.quizAnswers?.[0].points).toBe(3);
    expect(
      parseData({ ...data, sessions: [...data.sessions, session] }).sessions.at(
        -1,
      )?.quizAnswers,
    ).toEqual(session.quizAnswers);
  });
  it("reads old answer snapshots without point metadata and rejects invalid published values", () => {
    const data = demoData(now);
    const node = data.nodes.find((n) => n.id === "css")!;
    const session = gradeQuiz(
      node.id,
      node.quiz,
      node.quiz.map((q) => q.correctIndex),
      5,
      3,
      now,
    );
    session.quizAnswers!.forEach((answer) => {
      delete answer.points;
      delete answer.questionNumber;
    });
    const restored = parseData({
      ...data,
      sessions: [...data.sessions, session],
    });
    expect(assessmentPoints(restored.sessions.at(-1)!.quizAnswers!)).toEqual({
      earned: 5,
      total: 5,
    });
    expect(questionPoints({})).toBe(1);
    for (const points of [0, -1, 1.5, 1001]) {
      node.quiz[0].points = points;
      expect(() => parseData(data)).toThrow();
    }
  });
});

describe("learning to assessment to unlocking", () => {
  it("does not unlock a node by rounding a score below the threshold", () => {
    const data = demoData(now);
    data.sessions = data.sessions.filter((s) => s.nodeId !== "css");
    data.sessions.push({
      id: "boundary",
      nodeId: "css",
      at: now.toISOString(),
      minutes: 10,
      confidence: 4,
      correct: 199,
      total: 250,
      note: "",
    });
    expect(evidence(data, "css").score).toBe(79.6);
    expect(evidence(data, "css").verified).toBe(false);
  });
  it("grades the lesson and unlocks its actual children from accumulated evidence", () => {
    const before = demoData(now),
      topic = before.nodes.find((n) => n.id === "css")!;
    const result = gradeQuiz(
      topic.id,
      topic.quiz,
      topic.quiz.map((q) => q.correctIndex),
      12,
      4,
      now,
    );
    const after = parseData({
      ...before,
      sessions: [...before.sessions, result],
    });
    expect(result.correct).toBe(5);
    expect(result.total).toBe(5);
    expect(result.quizAnswers?.every((a) => a.isCorrect)).toBe(true);
    expect(evidence(before, topic.id).score).toBe(75);
    expect(evidence(after, topic.id).score).toBe(80);
    expect(
      newlyUnlocked(before, after)
        .map((n) => n.id)
        .sort(),
    ).toEqual(["box-model", "grid", "responsive"]);
    expect(skillState(after, topic)).toBe("verified");
  });
  it("does not confuse a passing attempt with passing cumulative evidence", () => {
    const before = demoData(now),
      topic = before.nodes.find((n) => n.id === "css")!;
    const answers = topic.quiz.map((q) => q.correctIndex);
    answers[0] = 0;
    const result = gradeQuiz(topic.id, topic.quiz, answers, 8, 3, now);
    const after = parseData({
      ...before,
      sessions: [...before.sessions, result],
    });
    expect(result.correct).toBe(4);
    expect(evidence(after, topic.id).score).toBe(76);
    expect(newlyUnlocked(before, after)).toEqual([]);
    expect(result.quizAnswers?.[0]).toMatchObject({
      isCorrect: false,
      selected: topic.quiz[0].options[0],
      correct: topic.quiz[0].options[1],
    });
  });
  it("rejects unanswered questions, empty tests and out-of-range selections", () => {
    const quiz = demoData(now).nodes.find((n) => n.id === "css")!.quiz;
    expect(() => gradeQuiz("css", quiz, [-1, 2, 0, 3, 1], 10, 3, now)).toThrow(
      "完成所有题目",
    );
    expect(() => gradeQuiz("css", [], [], 10, 3, now)).toThrow();
    expect(() => gradeQuiz("css", quiz, [5, 2, 0, 3, 1], 10, 3, now)).toThrow();
  });
  it("restores the exact question and answer history, and rejects inconsistent totals", () => {
    const data = demoData(now),
      topic = data.nodes.find((n) => n.id === "css")!;
    const result = gradeQuiz(
      topic.id,
      topic.quiz,
      topic.quiz.map((q) => q.correctIndex),
      4,
      3,
      now,
    );
    data.sessions.push(result);
    const restored = parseData(JSON.parse(JSON.stringify(data)));
    expect(restored.sessions.at(-1)?.quizAnswers).toEqual(result.quizAnswers);
    restored.sessions.at(-1)!.correct = 2;
    expect(() => parseData(restored)).toThrow("逐题作答一致");
  });
  it("migrates older backups without losing notes or study history", () => {
    const old = JSON.parse(JSON.stringify(demoData(now)));
    old.nodes.forEach((n: { content?: string; quiz?: unknown[] }) => {
      delete n.content;
      delete n.quiz;
    });
    const migrated = parseData(old);
    expect(migrated.nodes[0].content).toBe("");
    expect(migrated.nodes[0].quiz).toEqual([]);
    expect(migrated.sessions).toEqual(old.sessions);
    expect(migrated.reviews).toEqual(old.reviews);
  });
  it("requires real question volume, and a recall after the latest test, for higher ranks", () => {
    const data = demoData(now),
      topic = data.nodes.find((n) => n.id === "css")!;
    data.sessions = data.sessions.filter((s) => s.nodeId !== topic.id);
    const oneQuestion = gradeQuiz(
      topic.id,
      topic.quiz.slice(0, 1),
      [topic.quiz[0].correctIndex],
      2,
      5,
      now,
    );
    const small = { ...data, sessions: [...data.sessions, oneQuestion] };
    expect(evidence(small, topic.id).verified).toBe(false);
    const full = {
      ...data,
      sessions: [
        ...data.sessions,
        gradeQuiz(
          topic.id,
          topic.quiz,
          topic.quiz.map((q) => q.correctIndex),
          10,
          4,
          now,
        ),
      ],
    };
    expect(evidence(full, topic.id).rank).toBe(2);
    full.reviews.push({
      id: "after-test",
      nodeId: topic.id,
      at: new Date(now.getTime() + 60000).toISOString(),
      due: new Date(now.getTime() + 86400000).toISOString(),
      rating: 3,
      response: "能够独立回答",
    });
    expect(evidence(full, topic.id).rank).toBe(3);
  });
});

describe("numeric subjective self-assessment", () => {
  const question: QuizQuestion = {
    id: "manual-score",
    type: "short_answer",
    prompt: "解释你的设计。",
    points: 5,
    options: [],
    correctIndex: 0,
    referenceAnswer: "解释原因并给出例子。",
    rubric: ["说明原因", "给出例子"],
    explanation: "按实际完成情况给自己评分。",
  };
  it("stores partial credit independently of automatic results and rubric checkboxes", () => {
    const data = demoData(now),
      node = data.nodes.find((n) => n.id === "css")!;
    const automatic = node.quiz[0];
    const review = { reviewed: true, met: [true, true], score: 2.5 };
    expect(manualAssessmentComplete(question, review)).toBe(true);
    const session = gradeQuiz(
      node.id,
      [automatic, question],
      [automatic.correctIndex, "我的解释"],
      5,
      3,
      now,
      { [question.id]: review },
    );
    expect(session.correct).toBe(1);
    expect(session.total).toBe(1);
    expect(session.quizAnswers?.[1]).toMatchObject({
      selfScore: 2.5,
      isCorrect: false,
      points: 5,
    });
    expect(assessmentPoints(session.quizAnswers!, "self")).toEqual({
      earned: 2.5,
      total: 5,
    });
    const restored = parseData(
      JSON.parse(
        JSON.stringify({ ...data, sessions: [...data.sessions, session] }),
      ),
    );
    expect(restored.sessions.at(-1)?.quizAnswers?.[1].selfScore).toBe(2.5);
    expect(assessmentPoints(restored.sessions.at(-1)!.quizAnswers!)).toEqual({
      earned: 1,
      total: 1,
    });
    session.quizAnswers![1].selfScore = 6;
    expect(() =>
      parseData({ ...data, sessions: [...data.sessions, session] }),
    ).toThrow();
  });
  it("accepts an explicit zero or full score and rejects missing, invalid or unconfirmed scores", () => {
    for (const score of [0, 5]) {
      const session = gradeQuiz("css", [question], ["我的解释"], 5, 3, now, {
        [question.id]: {
          reviewed: true,
          met: [score === 5, score === 5],
          score,
        },
      });
      expect(session.correct).toBeNull();
      expect(session.total).toBeNull();
      expect(assessmentPoints(session.quizAnswers!, "self")).toEqual({
        earned: score,
        total: 5,
      });
      expect(session.quizAnswers?.[0].isCorrect).toBe(score === 5);
    }
    for (const score of [undefined, -1, 5.01, NaN, Infinity, 0.001]) {
      const review = { reviewed: true, met: [true, true], score };
      expect(manualAssessmentComplete(question, review)).toBe(false);
      expect(() =>
        gradeQuiz("css", [question], ["我的解释"], 5, 3, now, {
          [question.id]: review,
        }),
      ).toThrow("自评分数");
    }
    expect(
      manualAssessmentComplete(question, {
        reviewed: false,
        met: [true, true],
        score: 5,
      }),
    ).toBe(false);
  });
  it("sums decimal self-scores without binary rounding artifacts", () => {
    const questions = [
      { ...question, id: "decimal-a", points: 1 },
      { ...question, id: "decimal-b", points: 1 },
    ];
    const session = gradeQuiz(
      "css",
      questions,
      ["回答 A", "回答 B"],
      5,
      3,
      now,
      {
        "decimal-a": { reviewed: true, met: [false, false], score: 0.1 },
        "decimal-b": { reviewed: true, met: [false, false], score: 0.2 },
      },
    );
    expect(assessmentPoints(session.quizAnswers!, "self")).toEqual({
      earned: 0.3,
      total: 2,
    });
  });
  it("continues reading earlier rubric-only records without fabricating a numeric input", () => {
    const data = demoData(now);
    const session = gradeQuiz("css", [question], ["我的解释"], 5, 3, now, {
      [question.id]: { reviewed: true, met: [true, true], score: 5 },
    });
    delete session.quizAnswers![0].selfScore;
    const restored = parseData({
      ...data,
      sessions: [...data.sessions, session],
    });
    expect(restored.sessions.at(-1)!.quizAnswers![0].selfScore).toBeUndefined();
    expect(
      assessmentPoints(restored.sessions.at(-1)!.quizAnswers!, "self"),
    ).toEqual({ earned: 5, total: 5 });
  });
});
