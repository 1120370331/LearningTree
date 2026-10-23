import { ArrowDown, ArrowUp, Check, CheckCircle2, Code2 } from "lucide-react";
import type { QuizQuestion } from "./domain";
import { questionKind, type QuizResponse } from "./quiz";

export function QuestionInput({
  question,
  value,
  onChange,
  disabled,
}: {
  question: QuizQuestion;
  value: QuizResponse;
  onChange: (value: QuizResponse) => void;
  disabled: boolean;
}) {
  const kind = questionKind(question);
  const order = Array.isArray(value)
    ? value
    : question.options.map((_, i) => i);
  function move(position: number, direction: number) {
    const next = [...order];
    [next[position], next[position + direction]] = [
      next[position + direction],
      next[position],
    ];
    onChange(next);
  }
  return (
    <fieldset className="question-input" disabled={disabled}>
      <legend className="sr-only">本题作答</legend>
      {question.code && (
        <div className="question-code">
          <span>
            <Code2 size={13} />
            {question.language ?? "代码"} ·{" "}
            {kind === "code_fix" ? "待修复代码" : "阅读代码"}
          </span>
          <pre>{question.code}</pre>
        </div>
      )}
      {["single", "boolean", "multiple"].includes(kind) ? (
        <div className="quiz-options">
          {question.options.map((option, index) => {
            const checked =
              kind === "multiple"
                ? Array.isArray(value) && value.includes(index)
                : value === index;
            return (
              <label key={index} className={checked ? "chosen" : ""}>
                <input
                  type={kind === "multiple" ? "checkbox" : "radio"}
                  name={`question-${question.id}`}
                  checked={checked}
                  onChange={() => {
                    if (kind === "multiple") {
                      const selected = Array.isArray(value) ? value : [];
                      onChange(
                        checked
                          ? selected.filter((i) => i !== index)
                          : [...selected, index],
                      );
                    } else onChange(index);
                  }}
                />
                <span className="option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{option}</span>
                {checked && <CheckCircle2 size={17} />}
              </label>
            );
          })}
        </div>
      ) : kind === "order" ? (
        <div className="order-answer">
          <p>用上下按钮调整顺序，然后确认。顺序题需要全部位置正确。</p>
          <ol>
            {order.map((index, position) => (
              <li key={index}>
                <b>{position + 1}</b>
                <span>{question.options[index]}</span>
                <button
                  type="button"
                  disabled={disabled || position === 0}
                  aria-label={`上移第 ${position + 1} 项`}
                  onClick={() => move(position, -1)}
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  disabled={disabled || position === order.length - 1}
                  aria-label={`下移第 ${position + 1} 项`}
                  onClick={() => move(position, 1)}
                >
                  <ArrowDown size={15} />
                </button>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="button small"
            onClick={() => onChange([...order])}
          >
            <Check size={14} />
            {Array.isArray(value) ? "已确认顺序" : "确认此顺序"}
          </button>
        </div>
      ) : (
        <div className="written-answer">
          <label>
            {kind === "fill"
              ? "填写答案"
              : kind === "code_reading"
                ? "写出代码输出或结果"
                : kind === "code_fix"
                  ? "提交修复后的代码"
                  : kind === "project"
                    ? "提交实现说明、关键代码或项目链接"
                    : "用自己的话回答"}
            {kind === "fill" ? (
              <input
                aria-label="本题答案"
                maxLength={2000}
                value={typeof value === "string" ? value : ""}
                onChange={(e) => onChange(e.target.value)}
                autoComplete="off"
              />
            ) : (
              <textarea
                aria-label="本题答案"
                className={kind.startsWith("code_") ? "code-answer" : ""}
                rows={kind === "code_fix" || kind === "project" ? 10 : 5}
                maxLength={kind === "code_reading" ? 2000 : 12000}
                value={typeof value === "string" ? value : ""}
                onChange={(e) => onChange(e.target.value)}
                spellCheck={!kind.startsWith("code_")}
              />
            )}
          </label>
          {kind === "code_fix" && (
            <button
              type="button"
              className="text-button"
              onClick={() => onChange(question.code ?? "")}
            >
              从待修复代码开始编辑
            </button>
          )}
          {["short_answer", "code_fix", "project"].includes(kind) && (
            <p className="manual-answer-note">
              完成作答后对照参考答案和评分标准自评。代码仅作为文本保存，不会自动执行；自评不计入自动正确率。
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
