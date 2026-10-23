// Assemble authored repository content. This does not run tests or open SQLite.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, relative, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(
  new URL("../courses/builtin/frontend/", import.meta.url),
);
const catalog = JSON.parse(readFileSync(resolve(root, "catalog.json"), "utf8"));
function sourcePath(value) {
  const file = resolve(root, value);
  const inside = relative(root, file);
  if (inside.startsWith("..") || isAbsolute(inside))
    throw new Error("内容文件必须位于内置课程目录中");
  return file;
}
const pack = {
  format: "learning-tree-course",
  version: 1,
  name: catalog.name,
  release: catalog.release,
  trees: catalog.trees,
  nodes: catalog.nodes.map(({ lesson, questions, ...node }) => ({
    ...node,
    content: readFileSync(sourcePath(lesson), "utf8").trim(),
    quiz: JSON.parse(readFileSync(sourcePath(questions), "utf8")),
  })),
};
writeFileSync(
  resolve(root, "../frontend-tech-tree.json"),
  JSON.stringify(pack, null, 2) + "\n",
);
console.log(
  "已生成 courses/builtin/frontend-tech-tree.json；未启动应用或打开数据库。",
);
