## 这节课要解决什么问题

同样是一组元素，导航栏要排成一行，作品集要排成网格，手机上还要自动换列。选对布局工具，比反复调整像素更重要。

学完后，你应该能判断何时使用 Flexbox、何时使用 Grid，并解释它们与主轴、交叉轴的关系。

## Flexbox：先考虑一条轴

Flexbox 适合一维排列。默认的主轴是水平方向；设置 `flex-direction: column` 后，主轴变成竖直方向。

- `justify-content` 沿主轴对齐。
- `align-items` 沿交叉轴对齐。
- `gap` 控制相邻项目的间距。
- `flex-wrap: wrap` 允许空间不足时换行。

```css
.navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
```

上面的导航栏把第一个和最后一个项目推到两端，同时让不同高度的内容在交叉轴居中。注意：主轴改变后，两个对齐属性的视觉方向也会改变。

## Grid：同时安排行和列

Grid 适合二维排列。可以分别定义行和列，让卡片、图片和侧边栏按同一套网格对齐。

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
```

`1fr` 是一份可分配空间。三个 `1fr` 让三列平分剩余宽度；间隙会先从可用空间中扣除。

## 让布局随空间变化

固定三列不一定适合手机。下面的写法让浏览器根据容器宽度决定列数，同时维持每张卡片的最小宽度。

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}
```

如果屏幕窄于最小列宽，也需要调整最小值，或用媒体查询切换到单列。不要只验证一台设备。

## 动手想一想

做一个作品列表：整体区域包含一个侧边栏和一组卡片；每张卡片里又有图标、标题和操作按钮。

1. 用 Grid 安排整体区域及卡片网格。
2. 用 Flexbox 安排卡片内部的一行内容。
3. 缩窄窗口，检查文本、按钮和卡片是否挤出容器。

> Flexbox 和 Grid 可以一起使用。选择依据是要控制的维度，而不是哪个工具更“高级”。

准备好后，用下方的测验检查你是否真的能做出这些判断。
