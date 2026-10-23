# HTTP、Fetch 与请求状态

## 学完要能做到什么

能处理 HTTP 错误、解析失败和请求取消，并阻止过期响应覆盖最新查询结果。

## 核心概念

HTTP 方法、状态码和响应头共同描述请求与响应。GET 通常用于读取；POST 常用于提交处理。fetch 在网络失败时拒绝，但收到 404 或 500 响应通常仍兑现，因此需要检查 response.ok 或 status。

响应正文是流，常见的 json() 读取也可能失败；JSON 语法正确不代表字段结构满足业务要求。区分网络异常、HTTP 错误、解析失败与空数据，界面才能给出合适反馈。

连续搜索可能出现先发请求后返回。AbortController 可以取消不再需要的请求，另外也可用请求编号判断结果是否过期。取消通常不应该展示为普通失败。跨域权限由浏览器与服务端协议决定，no-cors 不能让前端自由读取任意跨域响应。

## 读懂一个最小例子

```javascript
async function getCourses(signal) {
  const response = await fetch("/api/courses", { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("课程数据格式错误");
  return data;
}
```

请求取消由传入 signal 控制。HTTP 检查、正文解析和数据结构检查分别覆盖不同失败层；调用方还要管理加载与错误状态。

## 两个容易混淆的地方

- 解析只说明正文可被解析为 JSON，仍需校验结构和业务含义。
- fetch 默认不因为 HTTP 500 而拒绝，不能只依赖网络层 catch。

## 动手完成一个小作品

实现带加载、空结果、失败重试和取消能力的课程搜索界面。

完成后，用下面的标准观察实际产出，而不是只看代码是否写完：

- 过期请求不覆盖当前结果或加载状态
- HTTP 与解析错误有可理解反馈
- 空结果与失败区分且可重新请求

## 如何留下学习证据

先完成本节练习，再在底部开始测验。选择、填空、排序与代码阅读自动判分；简答、改错和实战需要你对照参考答案逐项自评。自评不会计入自动正确率，也不代表系统已经执行或审查你的代码。

把仍说不清的概念写进个人笔记。复习时先尝试回答“搜索框输入从 a 变成 ab，怎样避免 a 的慢响应覆盖 ab？”，再核对参考解释。

## 继续阅读

[官方资料](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)。资料用于补充概念和边界，本节内容本身可以独立阅读。
