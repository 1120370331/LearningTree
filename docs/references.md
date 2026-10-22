# 参考项目与设计取舍

面向个人学习者持续获得反馈，按学习路径、间隔复习、知识结构、反馈与笔记四个方向检索。

检索记录包含 40 个去重候选；结合已知成熟项目选取 24 个仓库，完整克隆 22 个。Joplin 和 Excalidraw 在多次尝试后仍出现 GitHub 网络连接或对象下载失败，清单中保留失败原因，不计入完整克隆。

## 完整来源清单

克隆保留各自 Git 历史末端、原始许可证和 README；完整提交 SHA 位于 `references/manifest.json`。大多数为 depth=1 浅克隆，部分首批克隆使用 Git 对象过滤。未安装或执行参考项目。

| 项目                                                                                                                                  | 类别                | 许可证（GitHub 元数据） | 状态                | 提交         |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ----------------------- | ------------------- | ------------ |
| [kamranahmedse/developer-roadmap](https://github.com/kamranahmedse/developer-roadmap)                                                 | learning-paths      | NOASSERTION             | 已克隆              | 46aa6a6b533f |
| [24kchengYe/human-skill-tree](https://github.com/24kchengYe/human-skill-tree)                                                         | learning-paths      | NOASSERTION             | 已克隆              | be589ddd04c9 |
| [Preptics/SkillTreeOSS](https://github.com/Preptics/SkillTreeOSS)                                                                     | learning-paths      | MIT                     | 已克隆              | e9425008779a |
| [iuliaferoli/backtoengineering](https://github.com/iuliaferoli/backtoengineering)                                                     | learning-paths      | Apache-2.0              | 已克隆              | 4f29bd91af9e |
| [rajasegar/ember-skill-tree](https://github.com/rajasegar/ember-skill-tree)                                                           | learning-paths      | MIT                     | 已克隆              | af20607bd7b5 |
| [IvanR3D/skill-quest](https://github.com/IvanR3D/skill-quest)                                                                         | learning-paths      | 未识别，须读原文件      | 已克隆              | e2255d35f69c |
| [open-spaced-repetition/ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)                                                   | spaced-repetition   | MIT                     | 已克隆              | afef743be42e |
| [open-spaced-repetition/fsrs4anki](https://github.com/open-spaced-repetition/fsrs4anki)                                               | spaced-repetition   | MIT                     | 已克隆              | ff7c85cee735 |
| [ankitects/anki](https://github.com/ankitects/anki)                                                                                   | spaced-repetition   | NOASSERTION             | 已克隆              | 8d6e0a0f462f |
| [open-spaced-repetition/free-spaced-repetition-scheduler](https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler) | spaced-repetition   | MIT                     | 已克隆              | 93ed713fd9c1 |
| [eudoxia0/hashcards](https://github.com/eudoxia0/hashcards)                                                                           | spaced-repetition   | Apache-2.0              | 已克隆              | 8f05a628a223 |
| [hizzgdev/jsmind](https://github.com/hizzgdev/jsmind)                                                                                 | knowledge-structure | NOASSERTION             | 已克隆              | 2aeca49716c5 |
| [wanglin2/mind-map](https://github.com/wanglin2/mind-map)                                                                             | knowledge-structure | MIT                     | 已克隆              | e8e5ef9c41bc |
| [markmap/markmap](https://github.com/markmap/markmap)                                                                                 | knowledge-structure | MIT                     | 已克隆              | 122bf0500ee7 |
| [xyflow/xyflow](https://github.com/xyflow/xyflow)                                                                                     | knowledge-structure | MIT                     | 已克隆              | 8523d8dd9f15 |
| [dagrejs/dagre](https://github.com/dagrejs/dagre)                                                                                     | knowledge-structure | MIT                     | 已克隆              | 32e7f30f97f0 |
| [d3/d3-hierarchy](https://github.com/d3/d3-hierarchy)                                                                                 | knowledge-structure | ISC                     | 已克隆              | c4ae7066d5a5 |
| [HabitRPG/habitica](https://github.com/HabitRPG/habitica)                                                                             | feedback-and-notes  | NOASSERTION             | 已克隆              | 11b3150d90e6 |
| [laurent22/joplin](https://github.com/laurent22/joplin)                                                                               | feedback-and-notes  | NOASSERTION             | 下载失败/未完整检出 |              |
| [logseq/logseq](https://github.com/logseq/logseq)                                                                                     | feedback-and-notes  | AGPL-3.0                | 已克隆              | 05c3ae73e084 |
| [toeverything/AFFiNE](https://github.com/toeverything/AFFiNE)                                                                         | feedback-and-notes  | NOASSERTION             | 已克隆              | e32f8dce0475 |
| [purocean/yn](https://github.com/purocean/yn)                                                                                         | feedback-and-notes  | AGPL-3.0                | 已克隆              | 5822804b83c9 |
| [learningequality/kolibri](https://github.com/learningequality/kolibri)                                                               | feedback-and-notes  | MIT                     | 已克隆              | 26c3366e74f4 |
| [excalidraw/excalidraw](https://github.com/excalidraw/excalidraw)                                                                     | feedback-and-notes  | MIT                     | 下载失败/未完整检出 |              |

## 实际阅读与采用

| 实际阅读的参考                                                                                                      | 采用的思路                                                   | LearningTree 中的适配                                                                            |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `24kchengYe--human-skill-tree/app/src/types/skill.ts`、`app/src/components/skill-tree/skill-tree-canvas.tsx`        | 独立知识节点、可视化关系、选中节点详情                       | 简单层级使用本项目 SVG 连线与可访问 HTML 按钮；用明确状态展示学习证据                            |
| `iuliaferoli--backtoengineering/README.md`                                                                          | 稳定节点 ID；图结构应拒绝循环和失效引用                      | `domain.ts` 用稳定 UUID，导入和保存均检查父节点、同树关系与循环                                  |
| `Preptics--SkillTreeOSS/lib/store.ts`                                                                               | 当前树、选中节点、进度数据独立组织；持久化失败需要一致性处理 | 将领域统计与页面分开；先成功写入，再更新界面；不引入勾选即得 XP 的掌握判定                       |
| `IvanR3D--skill-quest/main.js`                                                                                      | 学习空间、学习树、近期活动、个人目标                         | 保留概览和每日目标，但不把活跃度与学习质量混为一谈                                               |
| `kamranahmedse--developer-roadmap/readme.md`                                                                        | 点击知识点进入主题和资源                                     | 节点详情包含个人笔记、学习资料、回忆题和记录入口                                                 |
| `node_modules/ts-fsrs/README_CN.md`、`dist/index.d.ts`；参考仓库 `packages/fsrs/src/scheduler/default-scheduler.ts` | 先预览评分对应时间，再提交评分；保存完整卡片状态和时间       | 使用锁文件中的已发布 ts-fsrs 5.4.2 / FSRS-6；目标保持率 0.9、关闭 fuzz；不直接照搬主分支实验接口 |
| `eudoxia0--hashcards/README.md`                                                                                     | 低摩擦的题目/答案；编辑内容后重置记忆计划                    | 一知识点一道回忆题，先作答后揭示；修改题目/答案时重置调度并保留日志                              |
| `markmap--markmap/README.md`、`d3--d3-hierarchy/src/tree.js`                                                        | 层级结构可直接形成树布局                                     | 本项目布局按叶节点分配行、父节点居中；当前不需要图编辑库和自由连接功能                           |
| `ankitects--anki/README.md`                                                                                         | 间隔复习作为独立学习流程                                     | 复习队列、四档自评和下一次时间；不把自评当作客观自测成绩                                         |

其余已克隆项目作为继续研究的参考库保留，未宣称逐行阅读或集成其代码。

## 产品取舍

- 优先完成“建立目标 → 学习与自测 → 反馈 → 主动回忆 → 下次复习”的闭环。
- 个人本地版使用浏览器持久化与可校验的完整备份，无登录门槛；云端同步和 AI 判卷不在这一版。
- 正确率只来自明确填写的题数。自信程度、学习时长和复习自评各自展示。
- 低分建议引用最近最多 5 次测试；高信心/低成绩提醒只检查每个知识点最新一次自测，新的有效证据可消除旧提醒。
- 使用原创建面和领域代码，未将 GPL/AGPL/未知许可证项目的源码直接拼入产品。参考库保留原版权；使用任何参考源码前仍需遵守对应许可证。

## 复现参考收集

运行 `python scripts/collect-references.py --retry` 可以复用元信息并尝试补齐下载。脚本使用独立 Git 子进程配置，不改全局 Git 设置。检索的原始查询和命中项目在 `references/search-results.json`。
