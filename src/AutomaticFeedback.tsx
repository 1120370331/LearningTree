import { CheckCircle2, X } from "lucide-react";
import type { Session } from "./domain";
import { assessmentPoints, questionPoints } from "./quiz";

export function AutomaticFeedback({
  session,
  questionNumbers,
}: {
  session: Session;
  questionNumbers: Record<string, number>;
}) {
  const score = assessmentPoints(session.quizAnswers ?? []);
  const percentage = session.total
    ? Math.round(((session.correct ?? 0) / session.total) * 100)
    : 0;
  return (
    <section
      className="automatic-feedback"
      aria-labelledby="automatic-feedback-title"
    >
      <header>
        <div>
          <h2 id="automatic-feedback-title">自动判分完成</h2>
          <p>
            答对 {session.correct} / {session.total} 题 · 得分 {score.earned} /{" "}
            {score.total} 分
          </p>
        </div>
        <strong className="automatic-percentage">
          {percentage}
          <small>% 正确率</small>
        </strong>
      </header>
      <p className="automatic-save-note">
        完成下方主观题自评后，一起保存本次记录。主观自评不计入自动成绩。
      </p>
      <details className="automatic-details">
        <summary>查看自动题答案与解析</summary>
        {session.quizAnswers?.map((answer, index) => (
          <article key={answer.questionId ?? index}>
            <div
              className={`automatic-verdict ${answer.isCorrect ? "is-correct" : "is-incorrect"}`}
            >
              {answer.isCorrect ? <CheckCircle2 size={16} /> : <X size={16} />}
              <span>
                第 {questionNumbers[answer.questionId ?? ""] ?? index + 1} 题 ·{" "}
                {answer.isCorrect ? "正确" : "待巩固"} ·{" "}
                {answer.isCorrect ? questionPoints(answer) : 0} /{" "}
                {questionPoints(answer)} 分
              </span>
            </div>
            <h3>{answer.question}</h3>
            {answer.code && <pre>{answer.code}</pre>}
            <p>
              <strong>你的答案：</strong>
              {answer.selected}
            </p>
            {!answer.isCorrect && (
              <p>
                <strong>正确答案：</strong>
                {answer.correct}
              </p>
            )}
            <p className="automatic-explanation">
              <strong>解析：</strong>
              {answer.explanation}
            </p>
          </article>
        ))}
      </details>
    </section>
  );
}
