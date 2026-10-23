# 盒模型与定位

## 学完要能做到什么

能计算元素实际占用空间，选择合适的 box-sizing，并为浮层或角标建立正确的定位上下文。

## 核心概念

标准盒模型下 width 表示内容区；内边距和边框增加边框盒的宽度。border-box 把内容、padding 和 border 一起计入指定宽度，margin 始终在边框外。

normal flow 决定普通内容如何排列。relative 通常保留原占位，偏移只改变视觉位置；absolute 脱离普通流，通常以最近的非 static 定位祖先为包含块。

fixed 常见情况下相对视口，但某些属性如 transform 会建立新的包含块。不要把定位当成常规布局的首选；先用流式、Flex 或 Grid，再为局部覆盖选择定位。

## 读懂一个最小例子

```css
.card { width: 240px; padding: 16px; border: 2px solid; box-sizing: border-box; position: relative; }
.badge { position: absolute; top: 8px; right: 8px; }
```

卡片的边框盒保持 240px，内容区宽度是 204px。卡片提供定位上下文，角标的 top/right 以该上下文计算。

## 两个容易混淆的地方

- relative 偏移视觉位置，不像 absolute 那样直接脱离普通流。
- 定位问题优先查包含块，不要不断试偏移量。

## 动手完成一个小作品

制作带角标的商品卡片，外宽固定 280px，包含内边距和边框；写出内容区宽度计算。

完成后，用下面的标准观察实际产出，而不是只看代码是否写完：

- 边框盒外宽确为 280px
- 角标位置依赖卡片而非页面
- 提供可复算的内容宽度计算

## 如何留下学习证据

先完成本节练习，再在底部开始测验。选择、填空、排序与代码阅读自动判分；简答、改错和实战需要你对照参考答案逐项自评。自评不会计入自动正确率，也不代表系统已经执行或审查你的代码。

把仍说不清的概念写进个人笔记。复习时先尝试回答“为什么绝对定位的角标常需要父卡片设置 position: relative？”，再核对参考解释。

## 继续阅读

[官方资料](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model)。资料用于补充概念和边界，本节内容本身可以独立阅读。
