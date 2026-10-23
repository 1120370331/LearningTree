import {
  blankData,
  daysAgo,
  emptyCard,
  scheduler,
  serializeCard,
  parseData,
  type Data,
} from "./domain";
import { createEmptyCard, Rating } from "ts-fsrs";
import { lessons } from "./lessons";

export function demoData(now = new Date()): Data {
  const data = blankData();
  data.demo = true;
  data.settings.name = "学习者";
  data.trees = [
    {
      id: "web",
      parentTreeId: null,
      prerequisiteTreeIds: [],
      title: "前端开发之路",
      description: "从页面到交互，独立做出一个好用的网页。",
      color: "green",
      createdAt: daysAgo(16, now).toISOString(),
    },
    {
      id: "data",
      parentTreeId: null,
      prerequisiteTreeIds: [],
      title: "用 Python 理解数据",
      description: "让数据回答一个真实的问题。",
      color: "blue",
      createdAt: daysAgo(8, now).toISOString(),
    },
    {
      id: "design",
      parentTreeId: null,
      prerequisiteTreeIds: [],
      title: "设计的日常练习",
      description: "观察、拆解，再亲手做一次。",
      color: "amber",
      createdAt: daysAgo(5, now).toISOString(),
    },
  ];
  const topics: [string, string, string | null, string, string, string][] = [
    [
      "html",
      "web",
      null,
      "HTML 与语义化",
      "为什么页面结构要使用语义化标签？",
      "语义化标签表达内容的意义，有助于辅助技术理解结构、改善可访问性，也使代码更容易维护。",
    ],
    [
      "css",
      "web",
      "html",
      "CSS 布局",
      "Flexbox 与 Grid 各适合解决什么问题？",
      "Flexbox 主要沿一个轴进行一维布局；Grid 适合同时控制行和列的二维布局。二者可以组合使用。",
    ],
    [
      "js",
      "web",
      "html",
      "JavaScript 基础",
      "let 与 const 的区别是什么？",
      "let 允许重新赋值，const 不允许重新绑定变量；const 声明的对象属性仍然可以修改。",
    ],
    [
      "responsive",
      "web",
      "css",
      "响应式设计",
      "如何让同一页面适配手机和桌面？",
      "使用流式布局、弹性图片、合理断点与媒体查询；从内容需要出发调整布局，并验证触摸和键盘操作。",
    ],
    [
      "closure",
      "web",
      "js",
      "闭包与作用域",
      "什么是闭包？请举一个实际用途。",
      "函数和其词法环境的组合使函数能访问定义时的外部变量，即使外部函数已返回。可用于封装私有状态，例如计数器工厂。",
    ],
    [
      "async",
      "web",
      "js",
      "异步与事件循环",
      "Promise 回调和 setTimeout 回调通常谁先执行？为什么？",
      "当前同步任务完成后先清空微任务队列，因此已兑现 Promise 的 then 回调通常先于定时器任务执行。",
    ],
    [
      "react",
      "web",
      "async",
      "React 与状态",
      "为什么不应直接修改 React state 中的对象？",
      "React 用引用变化识别更新。应创建新的对象或数组并调用状态设置函数，保持渲染快照的一致性。",
    ],
    ["project", "web", "react", "我的第一个作品", "", ""],
    [
      "box-model",
      "web",
      "css",
      "盒模型与定位",
      "标准盒模型与 border-box 有什么区别？",
      "标准盒模型的 width 仅包含内容；border-box 的 width 包含内容、内边距和边框。",
    ],
    [
      "grid",
      "web",
      "css",
      "Grid 进阶布局",
      "如何用 Grid 实现自适应卡片列？",
      "使用 repeat(auto-fit, minmax(最小宽度, 1fr)) 让列数按容器宽度变化。",
    ],
    [
      "accessibility",
      "web",
      "html",
      "可访问性",
      "为什么按钮需要可访问名称？",
      "屏幕阅读器需要用名称描述按钮作用；图标按钮应有明确文本或 aria-label。",
    ],
    [
      "dom",
      "web",
      "js",
      "DOM 与交互",
      "事件委托适合什么场景？",
      "将监听器放在公共祖先上，通过事件冒泡处理多个子元素；尤其适合动态列表。",
    ],
    [
      "typescript",
      "web",
      "js",
      "TypeScript 类型",
      "联合类型在使用前为何需要收窄？",
      "只有确认当前具体类型后，才能安全访问某个分支独有的属性。",
    ],
    [
      "network",
      "web",
      "async",
      "HTTP 与数据请求",
      "fetch 遇到 HTTP 404 会自动 reject 吗？",
      "不会，fetch 通常只在网络失败时拒绝；必须检查 response.ok 或状态码。",
    ],
    [
      "components",
      "web",
      "react",
      "组件设计",
      "什么情况下应该拆分组件？",
      "当一段 UI 拥有清晰职责、独立状态或复用需求时拆分，避免只按代码行数拆分。",
    ],
    [
      "testing",
      "web",
      "react",
      "测试与质量",
      "前端测试优先保护什么行为？",
      "优先保护核心用户路径、数据一致性和反复出现的故障，验证用户可观察结果。",
    ],
    [
      "deploy",
      "web",
      "project",
      "部署与发布",
      "发布前需要确认哪些关键事项？",
      "确认生产构建、真实路径、路由和资源地址、环境变量与回滚方式。",
    ],
    [
      "python",
      "data",
      null,
      "Python 基础",
      "列表和元组的主要区别是什么？",
      "列表可变，元组不可变。元组的元素本身仍可能是可变对象。",
    ],
    [
      "pandas",
      "data",
      "python",
      "Pandas 数据清理",
      "遇到缺失值时应该如何处理？",
      "先理解缺失原因和比例，再决定保留、删除或合理填补，避免无依据地替换所有缺失值。",
    ],
    ["charts", "data", "pandas", "数据可视化", "", ""],
    [
      "type",
      "design",
      null,
      "字体与层次",
      "如何建立清晰的信息层次？",
      "通过字号、字重、位置、间距和对比突出主要任务，减少同时竞争注意力的元素。",
    ],
    ["color", "design", "type", "色彩与对比", "", ""],
  ];
  data.nodes = topics.map(
    ([id, treeId, parentId, title, question, answer]) => ({
      id,
      treeId,
      parentId,
      title,
      question,
      answer,
      note: "",
      content: lessons[id]?.content ?? "",
      quiz: lessons[id]?.quiz ?? [],
      resource: "",
      card: emptyCard(now),
      createdAt: daysAgo(15, now).toISOString(),
    }),
  );
  const entries: [string, number, number, number, number, string][] = [
    ["html", 13, 35, 8, 10, "用语义化标签重写了自己的个人介绍页。"],
    ["css", 10, 40, 6, 10, "Grid 适合整体布局，Flex 更适合组件内部。"],
    ["js", 6, 30, 7, 10, "试着用自己的话解释变量作用域。"],
    ["css", 5, 25, 9, 10, "独立完成一个响应式卡片布局。"],
    ["closure", 4, 35, 4, 10, "能读懂例子，但自己写计数器时还会卡住。"],
    ["python", 3, 25, 8, 10, "练习了列表推导式。"],
    ["async", 2, 45, 5, 10, "微任务和普通任务的顺序还需要多练。"],
    ["js", 1, 30, 9, 10, "不用笔记也能解释 const 对象为什么还能修改。"],
    ["html", 0, 20, 9, 10, "完成了表单标签和键盘访问的自测。"],
  ];
  data.sessions = entries.map(
    ([nodeId, days, minutes, correct, total, note], i) => ({
      id: `demo-session-${i}`,
      nodeId,
      at: daysAgo(days, now).toISOString(),
      minutes,
      confidence: nodeId === "closure" ? 4 : 3,
      correct,
      total,
      note,
    }),
  );
  for (const node of data.nodes.filter((n) =>
    ["html", "css", "js", "python", "type"].includes(n.id),
  )) {
    const at = daysAgo(node.id === "type" ? 1 : 2, now);
    const result = scheduler.next(
      createEmptyCard(daysAgo(10, now)),
      at,
      Rating.Easy,
    );
    node.card = serializeCard(result.card);
    data.reviews.push({
      id: `demo-review-${node.id}`,
      nodeId: node.id,
      at: at.toISOString(),
      rating: 4,
      due: result.card.due.toISOString(),
      response: "（示例）能够独立说明这个概念并举例。",
    });
  }
  return parseData(data);
}
