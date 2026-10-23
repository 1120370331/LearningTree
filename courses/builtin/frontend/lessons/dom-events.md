# DOM、事件传播与交互

## 学完要能做到什么

能建立可清理的 DOM 交互，区分 target/currentTarget，并在动态列表中使用安全的事件委托。

## 核心概念

DOM 是当前文档的对象表示。querySelector 可能返回 null；访问属性前应明确元素是否存在。更新用户提供的普通文字优先使用 textContent，避免把文本误当 HTML 执行。

事件通常经历捕获、目标和冒泡阶段。target 是事件起源处的目标，currentTarget 是当前监听器注册所在元素。preventDefault 阻止默认动作，stopPropagation 阻止继续传播，两者不是同一回事。

事件委托把监听器放到共同祖先上，通过 closest 找到实际操作元素，并确认它属于当前容器。监听器、订阅和定时器应有清理策略，重复挂载不能悄悄叠加行为。

## 读懂一个最小例子

```javascript
const list = document.querySelector("#tasks");
list?.addEventListener("click", event => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-id]");
  if (!button || !list.contains(button)) return;
  console.log(button.dataset.id);
});
```

按钮内部可能包含图标，因此不能假定 target 就是 button。closest 向上查找操作元素，容器范围检查避免误处理其他区域。

## 两个容易混淆的地方

- 阻止默认动作与阻止传播是不同操作。
- 字符串替换几个危险词无法可靠净化 HTML；纯文本需求直接使用文本 API。

## 动手完成一个小作品

制作可动态新增和删除的任务列表，用一个列表监听器处理删除按钮。

完成后，用下面的标准观察实际产出，而不是只看代码是否写完：

- 新增项无需逐个重新绑定
- 点击文字与图标均正确定位条目
- 用户输入不被当作 HTML 且按钮可键盘操作

## 如何留下学习证据

先完成本节练习，再在底部开始测验。选择、填空、排序与代码阅读自动判分；简答、改错和实战需要你对照参考答案逐项自评。自评不会计入自动正确率，也不代表系统已经执行或审查你的代码。

把仍说不清的概念写进个人笔记。复习时先尝试回答“动态列表为什么适合事件委托，处理图标点击时应注意什么？”，再核对参考解释。

## 继续阅读

[官方资料](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling)。资料用于补充概念和边界，本节内容本身可以独立阅读。
