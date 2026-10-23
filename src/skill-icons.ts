import {
  Atom,
  Braces,
  Box,
  Code2,
  Component,
  Database,
  FileCode2,
  Frame,
  GitBranch,
  Globe2,
  Layers3,
  LayoutGrid,
  Palette,
  Rocket,
  ShieldCheck,
  Sparkles,
  Terminal,
  Type,
  Workflow,
  Zap,
} from "lucide-react";

export function skillIcon(title: string) {
  if (/html|语义/i.test(title)) return FileCode2;
  if (/react|组件/i.test(title)) return Atom;
  if (/grid|flex|布局/i.test(title)) return LayoutGrid;
  if (/盒|box/i.test(title)) return Box;
  if (/css|样式/i.test(title)) return Palette;
  if (/闭包|作用域/i.test(title)) return Braces;
  if (/异步|事件|promise/i.test(title)) return Zap;
  if (/type.?script|类型/i.test(title)) return Type;
  if (/git|版本/i.test(title)) return GitBranch;
  if (/测试|验证/i.test(title)) return ShieldCheck;
  if (/发布|部署|作品/i.test(title)) return Rocket;
  if (/数据|pandas/i.test(title)) return Database;
  if (/响应|适配/i.test(title)) return Frame;
  if (/交互|dom/i.test(title)) return Component;
  if (/网络|http|web/i.test(title)) return Globe2;
  if (/python|命令/i.test(title)) return Terminal;
  if (/工程|构建/i.test(title)) return Workflow;
  if (/基础|javascript/i.test(title)) return Code2;
  if (/设计/i.test(title)) return Layers3;
  return Sparkles;
}
