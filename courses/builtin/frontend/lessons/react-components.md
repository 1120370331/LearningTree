# React 组件、Props 与列表

## 学完要能做到什么

能把界面拆成有明确输入的组件，用稳定 key 维持列表身份，并保持渲染过程可预测。

## 核心概念

React 组件根据 props、state 和 context 描述界面。props 是只读输入；渲染应避免修改外部变量或直接发出请求。事件处理器承接用户动作，副作用在合适的生命周期中与外部系统同步。

组件边界适合围绕独立职责和重复结构，而不是把每个 div 都拆成文件。数据从父级传入，操作通过回调表达；避免子组件偷偷修改父级传下来的对象。

列表 key 帮助 React 识别同级元素身份。使用稳定业务 ID，不能用每次渲染的新随机数；可重排列表中使用索引可能让输入状态跟错条目。key 是 React 的特殊属性，需要 ID 时仍应显式传给组件。

## 读懂一个最小例子

```jsx
function CourseCard({ course, onSelect }) {
  return <button onClick={() => onSelect(course.id)}>{course.title}</button>;
}
function CourseList({ courses, onSelect }) {
  return <div>{courses.map(course =>
    <CourseCard key={course.id} course={course} onSelect={onSelect} />
  )}</div>;
}
```

父组件拥有数据和选择行为；卡片描述展示与点击意图。key 表达列表身份，course.id 通过普通 props 提供给业务代码。

## 两个容易混淆的地方

- key 是特殊属性，需要在组件中使用时应另传 id 等普通 prop。
- 事件属性需要一个可调用处理器，不能在渲染时执行用户动作。

## 动手完成一个小作品

实现可排序的课程卡片列表，卡片有标题、简述和学习按钮，由父级记录当前课程。

完成后，用下面的标准观察实际产出，而不是只看代码是否写完：

- 组件职责与输入输出明确
- 重排后 ID 和选择仍一致
- 操作由事件触发且不修改 props

## 如何留下学习证据

先完成本节练习，再在底部开始测验。选择、填空、排序与代码阅读自动判分；简答、改错和实战需要你对照参考答案逐项自评。自评不会计入自动正确率，也不代表系统已经执行或审查你的代码。

把仍说不清的概念写进个人笔记。复习时先尝试回答“为什么可重排输入列表使用数组索引 key 容易出问题？”，再核对参考解释。

## 继续阅读

[官方资料](https://react.dev/learn/passing-props-to-a-component)。资料用于补充概念和边界，本节内容本身可以独立阅读。
