import { Check, ClipboardList } from "lucide-react";
import type { QuizQuestion } from "./domain";
import {
  questionLabels,
  questionKind,
  questionPoints,
  validSelfScore,
  type ManualAssessment as Assessment,
  type QuizResponse,
} from "./quiz";

export function ManualAssessment({
  questions,
  questionNumbers,
  responses,
  assessments,
  onChange,
  pending,
}: {
  questions: QuizQuestion[];
  questionNumbers: Record<string, number>;
  responses: QuizResponse[];
  assessments: Record<string, Assessment>;
  onChange: (id: string, value: Assessment) => void;
  pending: boolean;
}) {
  return (
    <section className="manual-assessment">
      <div className="assessment-heading">
        <ClipboardList size={22} />
        <div>
          <h2>对照标准，评估你的解释与作品</h2>
          <p>
            对照参考答案与评分标准，填写每题的自评分数。自评分与自动成绩分开记录。
          </p>
        </div>
      </div>
      {questions.map((q, i) => {
        const value = assessments[q.id] ?? {
          reviewed: false,
          met: q.rubric!.map(() => false),
          score: undefined,
        };
        const maxPoints = questionPoints(q);
        const scoreValid = validSelfScore(value.score, maxPoints);
        return (
          <article key={q.id}>
            <header>
              <span>
                第 {questionNumbers[q.id]} 题 · {questionPoints(q)} 分 ·{" "}
                {questionLabels[questionKind(q)]}
              </span>
              <h3>{q.prompt}</h3>
            </header>
            <div className="assessment-answer-grid">
              <section>
                <h4>你的作答</h4>
                <pre>{String(responses[i] ?? "")}</pre>
              </section>
              <section>
                <h4>参考答案 / 实现思路</h4>
                <pre>{q.referenceAnswer}</pre>
              </section>
            </div>
            <fieldset disabled={pending}>
              <legend>只勾选你的作答实际满足的标准</legend>
              {q.rubric!.map((criterion, index) => (
                <label key={index}>
                  <input
                    type="checkbox"
                    checked={value.met[index] ?? false}
                    onChange={(e) =>
                      onChange(q.id, {
                        ...value,
                        reviewed: false,
                        met: q.rubric!.map((_, j) =>
                          j === index
                            ? e.target.checked
                            : (value.met[j] ?? false),
                        ),
                      })
                    }
                  />
                  <span>{criterion}</span>
                </label>
              ))}
              <div className="assessment-score-entry">
                <label htmlFor={`self-score-${q.id}`}>
                  自评分数 <span>必填</span>
                </label>
                <div className="assessment-score-input">
                  <input
                    id={`self-score-${q.id}`}
                    aria-label={`第 ${questionNumbers[q.id]} 题自评分数`}
                    aria-describedby={`self-score-hint-${q.id}`}
                    aria-invalid={value.score !== undefined && !scoreValid}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={maxPoints}
                    step="0.01"
                    required
                    placeholder="输入分数"
                    value={value.score ?? ""}
                    onChange={(e) =>
                      onChange(q.id, {
                        ...value,
                        reviewed: false,
                        score:
                          e.target.value === "" ||
                          !Number.isFinite(e.target.valueAsNumber)
                            ? undefined
                            : e.target.valueAsNumber,
                      })
                    }
                  />
                  <span>/ {maxPoints} 分</span>
                </div>
                <p
                  id={`self-score-hint-${q.id}`}
                  className={
                    value.score !== undefined && !scoreValid ? "form-error" : ""
                  }
                >
                  对照评分标准填写 0–{maxPoints} 分，可保留两位小数。
                </p>
              </div>
              <label className="assessment-reviewed">
                <input
                  type="checkbox"
                  checked={value.reviewed}
                  disabled={!scoreValid}
                  onChange={(e) =>
                    onChange(q.id, { ...value, reviewed: e.target.checked })
                  }
                />
                <span>
                  <Check size={13} />
                  我已对照标准完成自评（即使尚未达到标准，也可以确认）
                </span>
              </label>
            </fieldset>
            <p>{q.explanation}</p>
          </article>
        );
      })}
    </section>
  );
}
