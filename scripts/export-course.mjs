// Convert the repository's authored sample content into a portable course package.
// This only generates a JSON asset; it does not start the app or open the database.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const cache = new Map();
function loadContent(file) {
  if (cache.has(file)) return cache.get(file);
  const module = { exports: {} };
  cache.set(file, module.exports);
  const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const require = (specifier) => {
    if (!specifier.startsWith("."))
      throw new Error(`内容模块不能依赖外部运行时：${specifier}`);
    if (specifier.endsWith(".md?raw"))
      return {
        default: fs.readFileSync(
          path.resolve(path.dirname(file), specifier.slice(0, -4)),
          "utf8",
        ),
      };
    let target = path.resolve(path.dirname(file), specifier);
    if (!path.extname(target)) target += ".ts";
    return loadContent(target);
  };
  vm.runInNewContext(
    compiled,
    { module, exports: module.exports, require },
    { filename: file },
  );
  cache.set(file, module.exports);
  return module.exports;
}
const source = ts.createSourceFile(
  "demo.ts",
  fs.readFileSync(path.join(root, "src/demo.ts"), "utf8"),
  ts.ScriptTarget.Latest,
  true,
);
function literal(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return node.text;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isObjectLiteralExpression(node))
    return Object.fromEntries(
      node.properties
        .filter((p) => p.name?.getText(source) !== "createdAt")
        .map((p) => [
          p.name.getText(source).replace(/^['"]|['"]$/g, ""),
          literal(p.initializer),
        ]),
    );
  throw new Error("示例内容必须使用静态字段，无法转换此表达式。");
}
let trees, topics;
function walk(node) {
  if (ts.isBinaryExpression(node) && node.left.getText(source) === "data.trees")
    trees = literal(node.right);
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === "topics")
    topics = literal(node.initializer);
  ts.forEachChild(node, walk);
}
walk(source);
if (!trees || !topics) throw new Error("无法找到示例课程定义。");
const { lessons } = loadContent(path.join(root, "src/lessons.ts"));
const pack = {
  format: "learning-tree-course",
  version: 1,
  name: "LearningTree 入门课程包",
  trees,
  nodes: topics.map(([id, treeId, parentId, title, question, answer]) => ({
    id,
    treeId,
    parentId,
    title,
    question,
    answer,
    resource: "",
    content: (
      lessons[id]?.content ??
      (question ? `## 核心概念\n\n${question}\n\n${answer}` : "")
    ).trim(),
    quiz: lessons[id]?.quiz ?? [],
  })),
};
fs.mkdirSync(path.join(root, "courses"), { recursive: true });
fs.writeFileSync(
  path.join(root, "courses/frontend-foundations.json"),
  JSON.stringify(pack, null, 2) + "\n",
);
console.log(
  "已生成 courses/frontend-foundations.json（仅课程内容，不含个人记录）。",
);
