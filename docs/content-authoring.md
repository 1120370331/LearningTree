# 学习科技树与课程制作

LearningTree 的内容由作者维护为课程包，学习者在网页里阅读、作答和记笔记。课程包描述学习树、讲义、题库与回忆卡；个人笔记、学习历史和复习安排由 SQLite 保存。

## 内置前端课程

内置包位于 [`courses/builtin/frontend-tech-tree.json`](../courses/builtin/frontend-tech-tree.json)。它包含 1 个总树、8 个阶段子树、24 个知识点、24 篇讲义与 216 道题。每个知识点配有 6 道自动判分题、3 道标准自评题以及一张用于间隔复习的回忆卡。整个包不包含虚构的学习历史或完成状态。

| 阶段         | 知识点                                                       | 阶段前置                      |
| ------------ | ------------------------------------------------------------ | ----------------------------- |
| Web 与 HTML  | Web 页面如何运行、语义化 HTML、表单与可访问名称              | 无                            |
| CSS 与布局   | 盒模型与定位、Flex/Grid、响应式、设计变量与状态              | Web 与 HTML                   |
| JavaScript   | 值与引用、作用域与闭包、集合与不可变更新、Promise 与事件循环 | Web 与 HTML                   |
| 浏览器与网络 | DOM 与事件、HTTP/Fetch、存储与安全边界                       | JavaScript                    |
| TypeScript   | 类型与收窄、泛型与约束                                       | JavaScript                    |
| React 应用   | 组件与 Props、状态与副作用、路由与数据流                     | CSS、浏览器与网络、TypeScript |
| 工程与质量   | Git 与依赖、测试与调试、性能与测量                           | React 应用                    |
| 交付实战     | 可访问性与质量、部署与毕业作品                               | 工程与质量                    |

总树 `fe-root` 展示阶段路线；进入阶段子树后学习具体知识点。阶段 ID 为 `fe-stage-<阶段>`，节点 ID 为 `fe-<slug>`。阶段前置与树内依赖均来自内容定义，不依赖页面硬编码的课程顺序。

课程中的官方文档链接是延伸阅读来源；正文、例子和任务可独立阅读。本次没有逐一访问外部链接核对最新页面状态。

## 仓库中的制作 skills

| Skill                                                                                   | 用途                                                    |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| [learningtree-course-author](../.agents/skills/learningtree-course-author/SKILL.md)     | 学习目标、阶段编排、依赖关系、稳定 ID、课程包生成与更新 |
| [learningtree-lesson-author](../.agents/skills/learningtree-lesson-author/SKILL.md)     | 讲义正文、示例与输出解释、误区、练习、资料来源          |
| [learningtree-question-author](../.agents/skills/learningtree-question-author/SKILL.md) | 九种题型、答案与解析、评分标准、自动判分与自评边界      |

这些 skills 随仓库提供。支持 `.agents/skills` 的代理可直接发现；其他工具可以显式读取对应 `SKILL.md`。例如：“按照 learningtree-course-author 和 learningtree-question-author，为前端树新增 Web Components 分支，保留现有 ID 和个人进度。”

## 内容源码与生成物

```text
courses/
  builtin/
    frontend-tech-tree.json       # 可直接导入的完整课程包
    frontend/
      catalog.json                # 阶段、依赖、节点元信息和源码路径
      lessons/<slug>.md           # 独立 Markdown 讲义
      questions/<slug>.json       # 该节点的题目数组
scripts/
  build-builtin-course.mjs        # 组装课程包，不启动服务、不打开数据库
.agents/skills/
  learningtree-course-author/SKILL.md
  learningtree-lesson-author/SKILL.md
  learningtree-question-author/SKILL.md
```

修改源码后执行：

```powershell
npm run courses:build
```

`courses:example` 是同一生成命令的别名。`courses:legacy-example` 保留旧混合示例包的生成方式，输出 `courses/frontend-foundations.json`；旧示例与本次内置前端课程使用不同 ID，不应互相代替。

组装器只读取 catalog、Markdown 和题库 JSON，写出完整包；它不会测试题目、执行示例代码、访问网页或更新 SQLite。可导入的生成文件应与源码一起纳入版本管理。

## 新增知识点

1. 先定义可观察的学习目标，选择阶段以及真正需要的前置节点。
2. 在 `lessons/` 编写讲义。包括目标、概念解释、最小例子、误区、动手任务与完成标准；不能只放一个外链或提纲。
3. 在 `questions/` 编写 JSON 数组，按 [题库格式](question-format.md) 提供答案、解析和必要的自评标准。题型服务于学习目标，不要求未来每个节点机械凑齐全部九类。
4. 向 catalog 的 `nodes` 添加元信息，路径相对 `courses/builtin/frontend/`：

```json
{
  "id": "fe-example-topic",
  "treeId": "fe-stage-javascript",
  "parentId": "fe-js-values",
  "title": "示例知识点",
  "lesson": "lessons/example-topic.md",
  "questions": "questions/example-topic.json",
  "resource": "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
  "question": "本节点用于间隔复习的回忆问题是什么？",
  "answer": "一段可用于核对回忆的参考答案。"
}
```

5. 运行内容组装命令，按当前用户安排决定是否额外验证。生成成功只表示生成物已写出，不能代替功能验收。
6. 已经安装过课程的工作区，通过页面“偏好与数据 → 导入学习内容”导入生成包，或使用 CLI：

```powershell
npm run import:course -- courses/builtin/frontend-tech-tree.json
```

CLI 会写数据库；运行中的旧页面需载入新数据以更新 revision。仅运行 `courses:build` 不会修改当前学习内容。

## 依赖、解锁与内容身份

- `parentTreeId` 表示所属总树；`prerequisiteTreeIds` 表示阶段前置，可有多个。前置树需要完成其知识点及下属子树。
- 节点 `parentId` 表示树内单个前置节点，必须在同一棵树中。不要构造循环，也不要让子树依赖自己的祖先树。
- 解锁沿用最近最多 5 次有成绩的自测，按题数加权；这些记录合计至少 5 题且正确率至少 80% 才通过节点验证。新题库的标准自评不进入这一计算；旧版手工录入的自测成绩继续兼容。
- 内置节点每次有 6 道自动题，因此一次自动题答对至少 5 道可满足新节点的基本验证条件；已有近期记录仍参与加权。
- 仅主观题的节点不会凭自评自动通过客观验证。需要自动推进的必修节点，应提供足够且有效的自动题。
- 修改标题、解释或补充例子保留节点 ID；若学习目标实质改变，使用新 ID，避免继承不相关进度。实质更换一道测验时也使用新题目 ID。

## 自动安装与更新

服务端随仓库读取内置包。已有数据库第一次启用此版本时合并内置内容；新空库在浏览器第一次初始化保存时，将旧浏览器迁移数据与内置包一起写入同一事务。安装记录保存在 `installed_builtins`，与内容同步提交。

安装只自动执行一次。重启不会覆盖后续内容编辑，也不会重新添加主动删除的课程；改变包的 `release` 不会强制升级用户内容。需要升级时显式导入新包。导入同 ID 内容保留个人笔记、答题快照和历史，包里省略的节点不会被自动删除。

修改回忆题或其答案会重置该节点的当前 FSRS 卡片，历史回忆记录保留。修改普通测验不会重新判定已经保存的历史答题快照。

内置安装标记属于当前数据库，不包含在 JSON 工作区备份中。新建数据库后仍会执行一次内置安装；在已安装的数据库恢复备份不会因重启重新塞入用户已删除的内容。

## 外部课程包

外部作者可直接制作完整 JSON 包，不必使用内置课程目录。协议由 `src/course-package.ts` 与 `src/domain.ts` 定义，示例见 [SQLite 与课程包](sqlite-backend.md)。课程只携带内容，不能混入 `note`、`card`、`sessions` 或 `reviews` 等个人状态。

单包最大 32 MB；工作区最多 100 棵树、1,000 个知识点；单节点最多 30 道题、讲义最多 30,000 字符。导入对合并后的关系进行校验，失效引用和循环会被拒绝，不会部分写入。
