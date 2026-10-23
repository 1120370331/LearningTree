import {
  uid,
  selfScoreSchema,
  type QuizQuestion,
  type Session,
} from "./domain";

export type QuestionKind = NonNullable<QuizQuestion["type"]>;
export type QuizResponse = number | number[] | string | undefined;
export type ManualAssessment = {
  reviewed: boolean;
  met: boolean[];
  score?: number;
};
export const DEFAULT_QUESTION_POINTS = 1;
export const questionPoints = (question: { points?: number }) =>
  question.points ?? DEFAULT_QUESTION_POINTS;
export function validSelfScore(score: unknown, maxPoints: number): boolean {
  const parsed = selfScoreSchema.safeParse(score);
  return parsed.success && parsed.data <= maxPoints;
}
export function manualAssessmentComplete(
  question: QuizQuestion,
  review?: ManualAssessment,
): boolean {
  return (
    !!review?.reviewed &&
    validSelfScore(review.score, questionPoints(question)) &&
    review.met.length === question.rubric?.length &&
    review.met.every((v) => typeof v === "boolean")
  );
}
type AnswerSnapshot = NonNullable<Session["quizAnswers"]>[number];
export const answerPoints = (answer: AnswerSnapshot) =>
  answer.grading === "self" && answer.selfScore !== undefined
    ? answer.selfScore
    : answer.isCorrect
      ? questionPoints(answer)
      : 0;

export function assessmentPoints(
  answers: NonNullable<Session["quizAnswers"]>,
  grading: "automatic" | "self" = "automatic",
) {
  return answers
    .filter((answer) => (answer.grading ?? "automatic") === grading)
    .reduce(
      (score, answer) => ({
        earned: Math.round((score.earned + answerPoints(answer)) * 100) / 100,
        total: score.total + questionPoints(answer),
      }),
      { earned: 0, total: 0 },
    );
}
export const questionLabels: Record<QuestionKind, string> = {
  single: "单项选择",
  multiple: "多项选择",
  boolean: "判断题",
  fill: "填空题",
  order: "排序题",
  short_answer: "简答题",
  code_reading: "代码阅读",
  code_fix: "代码改错",
  project: "实战任务",
};
export const questionKind = (question: QuizQuestion): QuestionKind =>
  question.type ?? "single";
export const isManualQuestion = (question: QuizQuestion) =>
  ["short_answer", "code_fix", "project"].includes(questionKind(question));

export function answerComplete(
  question: QuizQuestion,
  answer: QuizResponse,
): boolean {
  const kind = questionKind(question);
  if (["single", "boolean"].includes(kind))
    return (
      typeof answer === "number" &&
      Number.isInteger(answer) &&
      answer >= 0 &&
      answer < question.options.length
    );
  if (kind === "multiple" || kind === "order") {
    return (
      Array.isArray(answer) &&
      answer.length > 0 &&
      new Set(answer).size === answer.length &&
      answer.every(
        (index) =>
          Number.isInteger(index) &&
          index >= 0 &&
          index < question.options.length,
      ) &&
      (kind !== "order" || answer.length === question.options.length)
    );
  }
  return typeof answer === "string" && answer.trim().length > 0;
}

function normalized(value: string, question: QuizQuestion) {
  let result = value.normalize("NFKC").trim();
  if (question.normalizeWhitespace !== false)
    result = result.replace(/\s+/g, " ");
  return question.caseSensitive ? result : result.toLocaleLowerCase("en-US");
}

export function gradeQuiz(
  nodeId: string,
  questions: QuizQuestion[],
  selections: QuizResponse[],
  minutes: number,
  confidence: number,
  now = new Date(),
  assessments: Record<string, ManualAssessment> = {},
): Session {
  if (
    !questions.length ||
    questions.length !== selections.length ||
    questions.some((q, i) => !answerComplete(q, selections[i]))
  )
    throw new Error("请完成所有题目后再提交");
  type Snapshot = NonNullable<Session["quizAnswers"]>[number];
  const quizAnswers: Snapshot[] = questions.map((q, i): Snapshot => {
    const kind = questionKind(q),
      response = selections[i];
    const base = {
      questionId: q.id,
      questionNumber: i + 1,
      points: questionPoints(q),
      type: kind,
      question: q.prompt,
      explanation: q.explanation,
      ...(q.code ? { code: q.code } : {}),
    };
    if (isManualQuestion(q)) {
      const review = assessments[q.id];
      if (!validSelfScore(review?.score, questionPoints(q)))
        throw new Error(
          `请填写第 ${i + 1} 题的自评分数（0–${questionPoints(q)} 分，最多两位小数）`,
        );
      if (!manualAssessmentComplete(q, review))
        throw new Error("请对照参考答案，完成每道主观题的标准自评");
      const rubricResults = q.rubric!.map((criterion, index) => ({
        criterion,
        met: review.met[index],
      }));
      return {
        ...base,
        grading: "self",
        selected: String(response).trim(),
        correct: q.referenceAnswer!,
        rubricResults,
        selfScore: review.score!,
        isCorrect: review.score === questionPoints(q),
      };
    }
    let selected: string,
      correct: string,
      responseKey: string,
      answerKey: string;
    if (kind === "multiple" || kind === "order") {
      const values = [...(response as number[])];
      const expected = [
        ...(kind === "multiple" ? q.correctIndices! : q.correctOrder!),
      ];
      if (kind === "multiple") {
        values.sort((a, b) => a - b);
        expected.sort((a, b) => a - b);
      }
      selected = values
        .map((index) => q.options[index])
        .join(kind === "order" ? " → " : "；");
      correct = expected
        .map((index) => q.options[index])
        .join(kind === "order" ? " → " : "；");
      responseKey = JSON.stringify(values);
      answerKey = JSON.stringify(expected);
    } else if (kind === "fill" || kind === "code_reading") {
      selected = String(response).trim();
      correct = q.acceptedAnswers![0];
      responseKey = normalized(selected, q);
      const accepted = q.acceptedAnswers!.map((value) => normalized(value, q));
      answerKey =
        accepted.find((value) => value === responseKey) ?? accepted[0];
    } else {
      selected = q.options[response as number];
      correct = q.options[q.correctIndex];
      responseKey = String(response);
      answerKey = String(q.correctIndex);
    }
    return {
      ...base,
      grading: "automatic",
      selected,
      correct,
      responseKey,
      answerKey,
      isCorrect: responseKey === answerKey,
    };
  });
  const automatic = quizAnswers.filter(
    (answer) => answer.grading === "automatic",
  );
  const correct = automatic.filter((answer) => answer.isCorrect).length;
  const selfCount = quizAnswers.length - automatic.length;
  const selfPoints = assessmentPoints(quizAnswers, "self");
  return {
    id: uid(),
    nodeId,
    at: now.toISOString(),
    minutes: Math.max(1, Math.min(720, Math.round(minutes))),
    confidence,
    correct: automatic.length ? correct : null,
    total: automatic.length || null,
    note: `${automatic.length ? `自动判分 ${correct}/${automatic.length}` : "无自动判分题"}${selfCount ? `；按标准自评 ${selfCount} 题，得分 ${selfPoints.earned}/${selfPoints.total} 分（不计入自动正确率）` : ""}。`,
    quizAnswers,
  };
}
