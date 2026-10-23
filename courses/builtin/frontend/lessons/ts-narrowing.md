# TypeScript 类型与收窄

## 学完要能做到什么

能用联合类型表达状态，通过运行时检查收窄 unknown，并分清类型断言和数据校验。

## 核心概念

TypeScript 为 JavaScript 提供静态类型分析。大多数类型信息编译后被擦除，不会自动检查网络响应。as 断言只是对编译器作出承诺，不会把字符串变成数字，也不会检查远程对象是否真实满足接口。

unknown 要求你先确定类型再使用，比直接传播 any 更能保留边界检查。typeof、instanceof、in 和用户定义的类型守卫可以收窄类型；注意 typeof null 也是 object，因此对象校验要排除 null。

可辨识联合通过字面量字段表达互斥状态，例如 status 为 loading、success 或 error。只在 success 分支提供 data，可让错误组合更难出现；可利用 never 做穷尽处理。

## 读懂一个最小例子

```typescript
type Result =
  | { status: "loading" }
  | { status: "success"; count: number }
  | { status: "error"; message: string };
function describe(result: Result): string {
  switch (result.status) {
    case "loading": return "加载中";
    case "success": return `共 ${result.count} 项`;
    case "error": return result.message;
  }
}
```

检查 status 后，编译器知道分支中哪些字段存在。运行时输入仍要先校验，不能直接把任意 JSON 断言成 Result。

## 两个容易混淆的地方

- 类型信息通常会被擦除，边界数据需要运行时校验。
- as string 不能让数字获得字符串方法。

## 动手完成一个小作品

为课程加载过程定义 loading、success、error 三种状态，并编写显示文案函数。

完成后，用下面的标准观察实际产出，而不是只看代码是否写完：

- 互斥状态不会同时携带矛盾字段
- 各分支访问字段受到类型约束
- 说明外部数据如何被校验

## 如何留下学习证据

先完成本节练习，再在底部开始测验。选择、填空、排序与代码阅读自动判分；简答、改错和实战需要你对照参考答案逐项自评。自评不会计入自动正确率，也不代表系统已经执行或审查你的代码。

把仍说不清的概念写进个人笔记。复习时先尝试回答“怎样避免 loading、error、data 三个独立字段出现互相矛盾的状态？”，再核对参考解释。

## 继续阅读

[官方资料](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)。资料用于补充概念和边界，本节内容本身可以独立阅读。
