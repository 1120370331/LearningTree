## 先把同步代码执行完

JavaScript 当前任务里的同步代码会先执行完，之后才会处理排队的回调。异步并不是把当前函数从中间打断。

```js
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');
// 通常依次输出 A、D、C、B
```

## 微任务与任务

已解决 Promise 的 then 回调进入微任务队列。当前任务结束后，浏览器会清空微任务队列，再处理下一项任务。因此上例的 Promise 回调先于定时器回调执行。

## await 暂停的是当前 async 函数

await 让当前异步函数暂停，等待承诺的结果，不会阻塞整个页面主线程。后续代码依然需要处理失败情况。

## 失败也是结果的一部分

使用 try/catch 捕获 await 抛出的错误，或者给 Promise 链添加 catch。对于 fetch，HTTP 404 等响应通常仍会兑现 Promise，应用还需要检查 response.ok。

## 避免长时间占用线程

很长的同步循环会阻塞后续回调和界面更新。异步 API 并不能自动让所有耗时计算消失。

先预测例子输出顺序，再运行验证，最后解释每一步进入了哪个队列。
