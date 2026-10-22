import cssLesson from "./content/css.md?raw";
import htmlLesson from "./content/html.md?raw";
import jsLesson from "./content/js.md?raw";
import closureLesson from "./content/closure.md?raw";
import asyncLesson from "./content/async.md?raw";
import type { QuizQuestion } from "./domain";
type Lesson = { content:string; quiz:QuizQuestion[] };
const questions=(prefix:string,items:[string,string[],number,string][]):QuizQuestion[]=>items.map(([prompt,options,correctIndex,explanation],i)=>({id:`${prefix}-${i+1}`,prompt,options,correctIndex,explanation}));
export const lessons:Record<string,Lesson>={
  css:{content:cssLesson,quiz:questions("css",[
    ["让导航栏中的项目沿一条轴排列，优先选择什么？",["CSS Grid 的固定二维模板","Flexbox","绝对定位每个项目","给每个项目加浮动"],1,"Flexbox 适合一维排列，导航栏是一种典型场景。"],
    ["flex-direction: column 时，justify-content 控制哪个方向？",["水平方向","元素的宽度","竖直主轴方向","文本书写方向"],2,"justify-content 始终沿主轴；column 会将主轴变为竖直方向。"],
    ["需要让多个卡片在行和列上同时对齐，哪种方式更合适？",["Grid","只用 margin-left","为每张卡片设置不同坐标","使用 br 换行"],0,"Grid 可以显式定义行与列，更适合二维布局。"],
    ["repeat(3, 1fr) 中的 1fr 表示什么？",["固定 1 像素","固定占容器的 1%","忽略间隙后占一整行","一份可分配的剩余空间"],3,"fr 是可分配空间的份额；三个 1fr 使三列平分可用的剩余宽度。"],
    ["同一个页面可以同时使用 Flexbox 和 Grid 吗？",["不可以，二者互斥","可以，按不同布局需要组合使用","只有在不同 HTML 文件中才可以","只有移动端可以"],1,"例如整体结构使用 Grid，卡片内部使用 Flexbox。"],
  ])},
  html:{content:htmlLesson,quiz:questions("html",[
    ["哪一个元素最适合表示页面主要内容？",["span","main","br","small"],1,"main 表示文档中主体内容。"],
    ["点击后展开一个面板，优先用什么元素？",["button","div","没有 href 的 a","img"],0,"这是一个界面操作，原生 button 提供可访问的操作语义。"],
    ["输入框只有 placeholder，是否足以替代 label？",["足够","只要颜色足够深就可以","不够，应保留关联的标签","只有手机上足够"],2,"placeholder 会消失，也不应替代持续可见且关联到控件的名称。"],
    ["纯装饰图片的 alt 应当怎么设置？",["写入文件路径","复制相邻段落","删除 img 标签","使用空 alt"],3,"空 alt 可让辅助技术忽略无意义的装饰图片。"],
    ["选择 h1、h2 等标题标签的主要依据是什么？",["默认字体大小","内容结构和层级","当前背景色","标题有多少个字"],1,"标题层级反映内容结构，外观应通过 CSS 调整。"],
  ])},
  js:{content:jsLesson,quiz:questions("js",[
    ["const user = {name: 'A'} 后，哪种操作合法？",["user = {}","user = null","user.name = 'B'","重新声明同名 const"],2,"const 限制重新绑定，并不自动冻结对象属性。"],
    ["let 与 const 都具有什么作用域特征？",["块级作用域","永远全局可见","只在 HTML 中有效","没有作用域"],0,"let 和 const 均遵循块级作用域。"],
    ["1 === '1' 的结果是什么？",["true","false","1","抛出语法错误"],1,"严格相等比较不会把字符串转换为数字。"],
    ["两个变量指向同一个对象，修改其属性后会怎样？",["自动复制两份对象","只改变局部文字","不会产生任何变化","从另一个变量也能看到修改"],3,"两个绑定共享同一个对象引用。"],
    ["浅拷贝一个含有嵌套对象的对象，意味着什么？",["嵌套对象一定完全独立","第一层独立，嵌套对象可能仍共享引用","所有层都被冻结","不能读取嵌套属性"],1,"展开运算符等常见浅拷贝不会递归复制所有嵌套对象。"],
  ])},
  closure:{content:closureLesson,quiz:questions("closure",[
    ["闭包让函数能够访问什么？",["定义时词法环境中的变量","任意其他函数的变量","只允许全局变量","只有调用参数"],0,"闭包保留对定义时词法环境的访问能力。"],
    ["外部函数返回后，被内部函数引用的变量一定立即消失吗？",["一定消失","取决于变量名字","不一定，仍可通过闭包访问","只有数字会消失"],2,"仍可达的闭包可以继续引用外部环境。"],
    ["两次调用 createCounter 通常会得到什么？",["共享同一个 count","各自独立的 count 环境","两个无法调用的值","一个全局 count"],1,"每次调用都会建立自己的函数执行环境。"],
    ["词法作用域主要由什么决定？",["调用者名字","函数运行时颜色","变量的数字大小","函数定义的位置"],3,"词法作用域依据源代码中的定义结构确定。"],
    ["闭包引用一个不再需要的大对象时，应关注什么？",["可能延长对象的内存存活时间","对象会自动变成字符串","闭包禁止保存对象","对象一定立即被释放"],0,"只要闭包仍可达且仍引用对象，该对象就可能无法被回收。"],
  ])},
  async:{content:asyncLesson,quiz:questions("async",[
    ["上面的 A、B、C、D 例子通常按什么顺序输出？",["A B C D","A D C B","C A D B","D C B A"],1,"先同步 A、D，再微任务 C，最后定时器任务 B。"],
    ["Promise.then 回调通常在哪个队列？",["样式队列","音频队列","微任务队列","只能同步执行"],2,"已兑现 Promise 的反应回调通过微任务运行。"],
    ["await 暂停的是什么？",["当前 async 函数的继续执行","整个操作系统","整个浏览器的所有任务","全部网络连接"],0,"await 暂停当前异步函数，不阻塞整个主线程等待。"],
    ["fetch 返回 HTTP 404 时，应该如何识别失败状态？",["它一定自动 reject","只看返回值是否为对象","忽略状态继续解析","检查 response.ok 或状态码"],3,"fetch 的网络失败与 HTTP 错误响应不同，需要显式检查响应状态。"],
    ["一个很长的同步循环对页面有什么影响？",["完全没有影响","可能阻塞界面更新和回调","自动变成微任务","一定在后台线程执行"],1,"主线程上的长同步计算会阻塞渲染和后续任务。"],
  ])},
};
