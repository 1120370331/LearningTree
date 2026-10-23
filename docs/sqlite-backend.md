# SQLite 后端与课程包

使用 Node.js 24 自带的 `node:sqlite`，不需要单独安装数据库服务或编译 SQLite npm 原生扩展。

## 启动

```powershell
npm ci
npm run dev
```

`npm run dev` 先启动 API，再启动 Vite。前端为 `http://127.0.0.1:5173`，API 为 `http://127.0.0.1:3001`，前端 `/api` 请求由 Vite 代理。已有前端进程时请先停止再重启，或单独运行 `npm run dev:api`。

运行时自动创建 `data/learningtree.sqlite`；同目录可能出现 SQLite 的 `-wal`、`-shm` 文件。数据目录已加入 Git 忽略。数据库位置按项目根目录解析，不随终端当前目录漂移。

可将 `.env.example` 复制为 `.env`，设置 `LEARNINGTREE_PORT` 和 `LEARNINGTREE_DB_PATH`。默认只监听本机，当前是一个个人工作区，不提供多用户账号。

生产运行方式：

```powershell
npm run build
npm start
```

此时 Node 服务直接提供 `dist/` 和 API，访问 `http://127.0.0.1:3001`。单独的静态托管无法保存数据库。

## 存储与写入

| 表                   | 内容                                         |
| -------------------- | -------------------------------------------- |
| `workspace_meta`     | 设置、工作区版本、初始化标记、更新时间       |
| `courses`            | 学习树定义、上级关系、前置依赖               |
| `topics`             | 节点内容、讲义、回忆题、九类测验题及参考答案 |
| `topic_progress`     | 个人笔记、FSRS 卡片状态和手动已学时间        |
| `study_sessions`     | 学习时长、自测成绩、逐题作答快照             |
| `review_events`      | 回忆作答、自评和复习安排                     |
| `course_imports`     | 课程包导入记录                               |
| `installed_builtins` | 内置包的安装标记、内容 release 与安装时间    |

SQLite 启用外键、WAL 和事务。一次保存原子更新内容及学习记录；只有服务器确认后，页面才显示保存成功。使用版本号防止旧页面覆盖新数据。冲突时保留当前表单，并提示载入最新数据后重试。

Schema 版本 3 为 `topic_progress` 增加可空的 `learned_at`，旧库自动升级并保留原有内容与记录。「标记为已学」直接计入节点及树的完成进度，推进推荐并解锁后续节点，不产生自测成绩或虚构学习时长。阅读页的当前笔记与已学标记在同一次事务中保存；课程包不携带个人已学状态，更新课程保留已有标记。

首次连接到空数据库时，会迁移当前浏览器的旧版 `learning-tree:v1` 数据，并保留原文。数据库已有工作区时不会被自动覆盖；可以在「偏好与数据」显式迁移旧数据。旧数据损坏时提供原文下载与跳过迁移入口。跳过迁移不会删除旧浏览器数据。

## 内置前端科技树

服务端读取 `courses/builtin/frontend-tech-tree.json`，包含一个总树、8 个阶段子树、24 个知识点和 216 道题。已有工作区首次启用此版本时，合并内置内容；新空库则在第一次初始化保存时，将旧浏览器迁移数据与内置内容写入同一事务。

SQLite schema 升级为版本 2，增加 `installed_builtins`。安装标记与内容一起提交，避免仅写标记却没有内容。该包自动安装一次，之后重启不覆盖编辑、不恢复删除；`release` 记录内容版本，不触发强制自动更新。已安装内容需要通过课程导入显式更新。

内容源码和仓库 skills 见 [课程制作指南](content-authoring.md)。学习题目中，单选、多选、判断、填空、排序和代码阅读自动判分；简答、代码改错和实战按标准自评。自评快照和评分项存入学习记录，但不计入自动正确率；代码不会在服务器上执行。

## 课程导入与备份恢复不同

**课程包**仅管理知识内容，适合攻略提供者维护和更新。**完整备份**包含内容、笔记、成绩、复习状态与设置，恢复时整体替换数据库工作区。

- 页面入口：「偏好与数据 → 导入学习内容 → 导入课程包」。左上项目导航也提供入口。
- 可下载完整内置课程包作为制作参考，或显式重新导入内置课程。内容包没有虚构的学习历史。
- 同 ID 内容原位更新；笔记、学习记录、答题快照和复习历史保留。
- 包中未包含的树和节点不删除。删除通过应用中的明确删除操作完成。
- 修改回忆题或参考答案会重置该题的下一次复习计划，历史事件仍保留。
- ID 是内容的稳定身份。修改标题不需要换 ID；如果知识点含义已经改变，应使用新的 ID，避免沿用不相关成绩。
- 支持跨树依赖；导入后对新旧课程的完整关系一并校验，拒绝循环和失效引用。
- 单文件最大 32 MB。工作区沿用最多 100 棵树、1,000 个节点、20,000 条学习记录和 20,000 条复习记录的限制。

命令行也可导入，不需要前端页面：

```powershell
npm run import:course -- courses/builtin/frontend-tech-tree.json
```

## 课程包格式

```json
{
  "format": "learning-tree-course",
  "version": 1,
  "name": "示例课程",
  "trees": [
    {
      "id": "my-course",
      "title": "我的课程",
      "description": "一个清楚的学习目标",
      "color": "blue",
      "parentTreeId": null,
      "prerequisiteTreeIds": []
    }
  ],
  "nodes": [
    {
      "id": "my-course-intro",
      "treeId": "my-course",
      "parentId": null,
      "title": "基础概念",
      "content": "## 学习内容\n\n这里填写 Markdown 讲义。",
      "resource": "",
      "question": "如何区分学习内容与学习记录？",
      "answer": "课程内容描述要学什么；学习记录描述个人的学习过程和结果。",
      "quiz": [
        {
          "id": "my-course-intro-q1",
          "prompt": "哪一项属于个人学习记录？",
          "options": [
            "讲义标题",
            "测验标准答案",
            "本次答题结果",
            "课程章节顺序"
          ],
          "correctIndex": 2,
          "explanation": "本次答题结果来自学习者的一次具体尝试。"
        }
      ]
    }
  ]
}
```

上例兼容旧单选格式；省略 `type` 等同于 `single`，`correctIndex` 从 0 开始。单选/多选/排序有 2–6 个不重复选项，判断题恰好 2 个；单节点最多 30 道题。其他题型和评分规则见 [九类题目格式](question-format.md)。

内置完整包位于 `courses/builtin/frontend-tech-tree.json`。编辑 `courses/builtin/frontend/` 中的编排、讲义与题库后，执行 `npm run courses:build`（或别名 `courses:example`）生成 JSON，不改动数据库。旧 `courses/frontend-foundations.json` 由 `courses:legacy-example` 生成。

## API

| 方法与路径                         | 用途                                                      |
| ---------------------------------- | --------------------------------------------------------- |
| `GET /api/health`                  | 服务状态                                                  |
| `GET /api/workspace`               | 工作区、revision、更新时间；新数据库 data 为 null         |
| `PUT /api/workspace`               | `{expectedRevision, data}`，保存或恢复整个工作区          |
| `POST /api/course-packages/import` | `{expectedRevision, package}`，合并课程内容并保留个人记录 |
| `GET /api/course-packages/example` | 下载完整内置前端课程包（保留原 API 路径）                 |

写入版本冲突返回 409，数据或关系校验失败返回 422。所有写入必须为 JSON 请求。

## 本次交付说明

已编写后端、SQLite 数据结构、内置课程的一次安装、旧数据迁移、课程导入和九类题型保存流程。按用户要求，本次没有运行构建、测试、接口请求或浏览器验收，也没有启动服务或打开数据库；内容生成命令只写入仓库课程文件。数据库升级及安装会在实际运行时发生。
