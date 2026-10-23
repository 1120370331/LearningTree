# LearningTree

面向个人学习者的网页应用：蓝白工作台、可拖拽缩放的游戏式技能树，以及「学习内容 → 底部开始测验 → 判分反馈 → 解锁节点」的完整流程。

当前布局保留左侧导航；项目导航位于画布左上，右侧为固定任务指挥台。新版设计与参考项目见 [交互重做说明](docs/interaction-redesign.md)。

## 运行

使用 Node.js 24 LTS，在项目根目录执行：

```powershell
npm ci
npm run dev
```

打开 http://127.0.0.1:5173 。此命令同时启动 Node API 和前端。学习数据保存在 `data/learningtree.sqlite`，首次启动自动建库并安装内置前端学习科技树；空数据库会在首次初始化时合并当前浏览器的旧数据。已有服务进程需要停止后重新运行此命令。

```powershell
npm test           # 数据一致性、反馈规则、FSRS 调度测试
npm run typecheck  # TypeScript 检查
npm run build      # 构建到 dist/
npm run preview    # 预览构建产物
```

`npm run preview` 需要另外运行 `npm run dev:api`；日常开发直接使用 `npm run dev` 即可同时启动两端。

生产运行使用 `npm run build` 后执行 `npm start`，由 Node 同时提供前端和 API，访问 http://127.0.0.1:3001 。当前为本机单人工作区，无需账号或 API 密钥。SQLite 配置、接口和导入格式见 [后端与课程包说明](docs/sqlite-backend.md)。

## 使用流程

1. 在左上项目导航选择或创建学习树；点击「推荐节点」聚焦放大，展开「推荐路线」查看学习顺序。
2. 从右侧任务指挥台「开始学习」，阅读内容、示例并保存笔记；已掌握的节点可点击「标记为已学」跳过，直接推进进度与解锁后续节点。该标记与测验成绩分别记录，刷新或课程更新后保留。学习者界面不提供延伸、删除节点入口。
3. 从学习页底部「开始测验」，提交后先查看选择、判断、填空、排序、代码阅读等自动题的成绩与逐题解析；简答、代码改错和实战题另行对照参考答案与评分项自评。完成后一起保存记录并更新节点进展。
4. 近期正确率按最近最多 5 次有成绩的自测题数加权；达到 80% 且这些记录合计至少 5 题后，通过节点验证。标准自评单独保存，不进入自动正确率。
5. 讲义与题库由作者通过 JSON 课程包维护和导入，学习者直接阅读、作答和记录笔记。同一 ID 的课程更新保留个人进度。
6. 复习流程仍使用 FSRS；先回忆、再核对参考答案、自评并安排下一次复习。
7. 在「偏好与数据」调整每日目标、导出备份或恢复备份。
8. 点击「添加子树」创建嵌套学习树，或在项目编辑中设置「上级学习树」和「前置学习树」。子树节点更大、边框加粗，点击可进入，左上可返回上级。推荐路线先安排前置树。

## 内置课程与制作 skills

仓库内置 **8 个阶段、24 个知识点、24 篇讲义和 216 道题**：Web/HTML → CSS 与 JavaScript → 浏览器与 TypeScript → React → 工程与质量 → 交付实战。总树展示阶段依赖，进入子树后学习具体知识点。每节均有概念解释、代码例子、误区、动手任务、回忆卡与九类题目。

| 内容                     | 位置                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------ |
| 完整可导入课程包         | [courses/builtin/frontend-tech-tree.json](courses/builtin/frontend-tech-tree.json)   |
| 阶段与知识点编排         | [catalog.json](courses/builtin/frontend/catalog.json)                                |
| 讲义源码                 | [lessons/](courses/builtin/frontend/lessons/)                                        |
| 题库源码                 | [questions/](courses/builtin/frontend/questions/)                                    |
| 科技树与课程包制作 skill | [learningtree-course-author](.agents/skills/learningtree-course-author/SKILL.md)     |
| 讲义制作 skill           | [learningtree-lesson-author](.agents/skills/learningtree-lesson-author/SKILL.md)     |
| 九类题库制作 skill       | [learningtree-question-author](.agents/skills/learningtree-question-author/SKILL.md) |

144 道自动题覆盖单选、多选、判断、填空、排序和代码阅读；72 道标准自评题覆盖简答、代码改错和实战任务。代码只作为文本展示和保存，不自动执行。题目有答案、解析，自评题另有可观察评分标准。

维护流程见 [课程制作指南](docs/content-authoring.md) 和 [九类题目格式](docs/question-format.md)。修改独立 Markdown/JSON 源码后生成课程包：

```powershell
npm run courses:build
```

生成命令不修改数据库。内置包只自动安装一次，重启不覆盖用户编辑、不恢复已删除课程；更新已安装内容时，在「偏好与数据」导入生成包，或执行：

```powershell
npm run import:course -- courses/builtin/frontend-tech-tree.json
```

`courses:example` 是新内置包生成的别名；旧混合示例的生成保留为 `courses:legacy-example`。

## 数据与边界

- 学习树、讲义与题库、个人笔记、成绩、复习记录和偏好保存到 SQLite；浏览器不再承担主要持久化。
- 首次空库迁移旧浏览器记录，保留旧原文。数据库已有数据时不自动覆盖，可在设置中显式迁移。
- 课程包按稳定 ID 合并内容，保留笔记与历史；完整备份恢复则在确认后整体替换工作区。
- 保存使用事务和 revision，服务器确认后才更新界面；旧页面不能静默覆盖新数据。
- JSON 文件最大 32 MB；工作区最多 100 棵学习树、1,000 个知识点、30 层树结构、20,000 条学习记录和 20,000 条复习记录。
- 删除知识点会删除其子节点和关联记录；删除树时保留子树并调整关系。修改回忆题会重置当前复习卡，历史记录保留。
- 当前是本机单人版，无远程账号和云同步；请定期导出完整 JSON 备份。

## 结构

| 文件                 | 职责                                   |
| -------------------- | -------------------------------------- |
| `src/domain.ts`      | 数据契约、关系校验、反馈统计、复习调度 |
| `src/storage.ts`     | API 通信、旧数据迁移、导入与导出       |
| `src/demo.ts`        | 隔离标记的示例空间                     |
| `src/App.tsx`        | 导航、操作、持久化和错误处理           |
| `src/pages.tsx`      | 概览、学习树、复习、反馈、日志、设置   |
| `src/forms.tsx`      | 学习树、知识点、学习记录表单           |
| `src/components.tsx` | 可访问弹窗、知识树布局和共享组件       |
| `src/domain.test.ts` | 核心数据与调度回归测试                 |
| `references/`        | 搜索结果、参考清单、独立 Git 浅克隆    |

后端文件：`server/index.ts` 提供 API 和生产静态服务，`server/database.ts` 管理 SQLite，`src/course-package.ts` 定义导入协议。内置前端课程包位于 `courses/builtin/frontend-tech-tree.json`；旧混合示例包保留在 `courses/frontend-foundations.json`。

本次内置课程、多题型与 SQLite 安装接入按用户要求未运行构建、测试、接口或浏览器验证；仅生成内容文件，交由用户验收。

## 参考项目

参考项目克隆在当前目录的 `references/`，独立仓库不纳入本项目 Git。详见 [参考项目与取舍](docs/references.md)、[检索结果](references/search-results.json) 和 [来源/许可证/提交清单](references/manifest.json)。

```powershell
python scripts/collect-references.py          # 检索并收集
python scripts/collect-references.py --retry  # 复用元信息，补齐未完成克隆
```

脚本仅下载，不安装或运行参考仓库。它对自身 Git 子进程隔离本机 URL 重写配置，不修改用户全局配置。界面和业务实现为本项目编写，参考仓库代码未直接复制进产品。实际使用的运行时依赖包括 React、Lucide、Zod、ts-fsrs，其许可证保留在安装包中。

产品范围见 [交付约定](docs/intent.md)，验证结果见 [验收记录](docs/verification.md)。

## 开源许可

本项目采用 [MIT 许可证](LICENSE)。第三方组件和参考项目保留各自的许可证；相关声明见 [licenses/](licenses/) 和 [参考项目与取舍](docs/references.md)。
