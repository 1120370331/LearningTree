# 题库格式与判分约定

题库是节点 `quiz` 中的题目数组。内置课程将它独立保存在 `courses/builtin/frontend/questions/<slug>.json`，组装时嵌入课程包。实际契约在 `src/domain.ts`，答题和判分在 `src/QuestionInput.tsx`、`src/ManualAssessment.tsx` 与 `src/quiz.ts`。

## 共用字段

| 字段                | 说明                                                                     |
| ------------------- | ------------------------------------------------------------------------ |
| `id`                | 稳定题目 ID，1–100 字符，同节点内唯一                                    |
| `type`              | 下列九类之一；旧包省略时按 `single` 处理                                 |
| `prompt`            | 题干，1–2,000 字符，包含必要前提和答题格式                               |
| `points`            | 可选正整数，1–1,000；省略时每题默认 1 分，答题、自评和解析页均显示       |
| `explanation`       | 答后解析，最多 4,000 字符；制作时应提供原因或反例                        |
| `difficulty`        | 可选：`basic`、`applied`、`advanced`，不改变计分权重                     |
| `code` / `language` | 代码文本最多 12,000 字符，语言标识最多 30 字符；代码仅展示、保存，不执行 |

`options` 最多 6 项，每项 1–1,000 字符且不重复。选择与排序题至少 2 项。索引从 **0** 开始，必须指向已有项。源 JSON 可省略与题型无关的 `options`、`correctIndex`；导入时分别规范为 `[]` 和 `0`。不要为主观题硬造选项。

单节点最多 30 道题。下列示例展示完整单题对象；将需要的对象放入 JSON 数组即可。

题号按测验数组顺序从 1 自动生成，不必写进题干；自评页和错题筛选保留原题号。提交时将原题号和当时分值存入答题快照，后续调整题库不会改变历史得分。自动题答对得本题全部分值，否则为 0；标准自评题由学习者填写 0 至本题满分的分数，支持最多两位小数，并与自动得分分别汇总。

## 1. 单选 `single`

```json
{
  "id": "sample-single",
  "type": "single",
  "prompt": "普通表单提交时，哪个属性决定字段键名？",
  "options": ["name", "class", "placeholder"],
  "correctIndex": 0,
  "explanation": "name 对应提交字段名；id 主要用于元素识别和标签关联。"
}
```

选择索引与 `correctIndex` 相同才正确，每题计 1 道，得分按该题 `points`（默认 1 分）计算。

## 2. 多选 `multiple`

```json
{
  "id": "sample-multiple",
  "type": "multiple",
  "prompt": "选择所有计入 border-box width 的部分。",
  "options": ["内容区", "padding", "border", "margin"],
  "correctIndices": [0, 1, 2],
  "explanation": "margin 在边框盒之外。"
}
```

`correctIndices` 至少 1 项、不能重复。所选集合必须完全一致；少选、多选都不正确，不提供部分得分，选择顺序不影响结果。

## 3. 判断 `boolean`

```json
{
  "id": "sample-boolean",
  "type": "boolean",
  "prompt": "const 会自动冻结对象的所有属性。",
  "options": ["正确", "错误"],
  "correctIndex": 1,
  "explanation": "const 限制绑定的重新赋值，不冻结对象内部属性。"
}
```

必须恰好两个选项，使用“正确”“错误”文字避免歧义；以索引为准判分。

## 4. 填空 `fill`

```json
{
  "id": "sample-fill",
  "type": "fill",
  "prompt": "使用 CSS 自定义属性取值的函数是 ____。",
  "acceptedAnswers": ["var", "var()"],
  "caseSensitive": false,
  "normalizeWhitespace": true,
  "explanation": "例如 color: var(--text-primary)。"
}
```

`acceptedAnswers` 为 1–20 个字符串，每个最多 2,000 字符。匹配任一别名即正确，第一项用于显示参考答案。

文本比较始终先做 Unicode NFKC 规范化并去除首尾空白；默认将连续空白折叠为空格、忽略大小写。`caseSensitive: true` 保留大小写，`normalizeWhitespace: false` 保留内部空白差异。即使关闭空白折叠，首尾空白仍会去除。没有正则、模糊匹配或语义评分；若空白本身是考点，应在题干与可接受答案中明确表达。

## 5. 排序 `order`

```json
{
  "id": "sample-order",
  "type": "order",
  "prompt": "将 CSS 盒模型组成按从内到外排序。",
  "options": ["border", "content", "margin", "padding"],
  "correctOrder": [1, 3, 0, 2],
  "explanation": "从内到外依次是 content、padding、border、margin。"
}
```

`correctOrder` 必须包含所有选项索引且每项恰好一次。全序列匹配才正确。页面提供上下移动与确认顺序按钮；不能用排序题强迫本来可并行或有多种正确顺序的工作流。

## 6. 代码阅读 `code_reading`

```json
{
  "id": "sample-reading",
  "type": "code_reading",
  "prompt": "console.log 输出什么？用空格分隔两个结果。",
  "code": "console.log(\"5\" + 1, Number(\"5\") + 1);",
  "language": "javascript",
  "acceptedAnswers": ["51 6"],
  "caseSensitive": true,
  "explanation": "第一项拼接字符串，第二项显式转换后相加。"
}
```

需要非空 `code`。判分规则与填空相同。题干应说明运行环境、输出格式和必要上下文；系统不会执行片段来猜答案。

## 7. 简答 `short_answer`

```json
{
  "id": "sample-short",
  "type": "short_answer",
  "prompt": "为什么客户端 required 不能替代服务端校验？",
  "referenceAnswer": "请求可以绕过网页直接发送。客户端约束改善输入体验，服务端仍需校验输入类型、范围和业务规则。",
  "rubric": [
    "指出请求可绕过前端",
    "区分用户体验与服务端数据边界",
    "给出具体服务端校验内容"
  ],
  "explanation": "输入约束必须在实际接收数据的可信边界上落实。"
}
```

## 8. 代码改错 `code_fix`

```json
{
  "id": "sample-fix",
  "type": "code_fix",
  "prompt": "返回数值升序的新数组，保留输入数组顺序。",
  "code": "function ranked(values) { return values.sort(); }",
  "language": "javascript",
  "referenceAnswer": "function ranked(values) { return [...values].sort((a, b) => a - b); }",
  "rubric": ["使用数值比较函数", "不修改输入数组", "返回正确的新排序结果"],
  "explanation": "原代码同时存在默认字符串比较和原地修改两个问题。"
}
```

需要非空 `code`。允许等价实现，自评依据可观察标准；不把字符串完全相同作为正确性的要求。

## 9. 实战 `project`

```json
{
  "id": "sample-project",
  "type": "project",
  "prompt": "制作支持失败重试的课程搜索页，提交实现说明、关键代码或项目链接。",
  "referenceAnswer": "编码查询参数，区分加载、空结果、失败与成功；取消或忽略过期响应，失败保留查询词并提供重试。",
  "rubric": ["状态与反馈完整", "过期结果不覆盖当前查询", "保留输入并能重试"],
  "explanation": "以真实交互结果评估，不仅观察静态截图。"
}
```

## 标准自评规则

简答、改错与实战需要 `referenceAnswer`（非空，最多 12,000 字符）与 `rubric`（2–8 条，每条 1–500 字符）。标准应具体且可观察，不能只写“理解深入”或“代码优雅”。

学习者先提交自己的文字、代码或作品链接，再进入参考答案对照页面，勾选实际满足的标准，在「自评分数」输入框填写分数，并确认已完成自评。分数必须在 0 至本题满分之间，最多两位小数；必须显式填写，0 分也可确认并保存。未填写、超出范围或修改评分后尚未重新确认时不能保存。评分项供对照参考，实际得分以学习者输入为准；只有自评满分的题目才不列入「待改进」。

系统不会运行代码、打开作品链接、做 AI 语义评分或假装人工审阅。自评结果与自动题分开保存，**不进入自动正确率和节点客观验证成绩**。一次只有自评题的学习记录，成绩 `correct`、`total` 均为 `null`，但保留作答和评分项。

## 反馈与兼容

- 自动题得分按配置分值汇总；多选与排序均按整题计分。节点的正确率仍按实际答对题数 / 自动题数计算，不混入自评分值。
- 答题记录保留题目 ID、原题号、分值、类型、题干、原代码、作答、参考答案、解释与判分方式；自评另外保存每个评分项的达成状态和 `selfScore` 数值。旧记录没有 `selfScore` 时沿用原评分项的全达成/未全达成计分；没有分值时按每题 1 分显示，题号回退到原记录顺序。
- 填空别名或标准化后匹配时，比较用的规范值与显示文字分别保存，避免有效别名在重载时被误判。
- 旧单选包和旧作答记录继续读取；缺少 `type` 的题目按单选处理，缺少 `grading` 的旧答题快照计为自动题。
- 内容更新不会改写过去的答题快照。实质换题时使用新 ID，学习目标也变了则新建知识点，避免成绩被错误继承。

当前内置题库每类 24 道，共 216 道：144 道自动题、72 道标准自评题。可参考实际源码 [`courses/builtin/frontend/questions/`](../courses/builtin/frontend/questions/) 制作后续题库。
