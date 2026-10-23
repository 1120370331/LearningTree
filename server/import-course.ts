import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCoursePackage } from "../src/course-package.ts";
import { LearningDatabase } from "./database.ts";

const input = process.argv[2];
if (!input) {
  console.error("用法：npm run import:course -- <课程包.json>");
  process.exitCode = 1;
} else {
  const file = resolve(process.cwd(), input);
  if ((await stat(file)).size > 32 * 1024 * 1024)
    throw new Error("课程包不能超过 32 MB。");
  const pack = parseCoursePackage(JSON.parse(await readFile(file, "utf8")));
  const root = fileURLToPath(new URL("../", import.meta.url));
  const database = new LearningDatabase(
    resolve(
      root,
      process.env.LEARNINGTREE_DB_PATH ?? "data/learningtree.sqlite",
    ),
  );
  try {
    const current = database.read();
    const result = database.importCourse(pack, current.revision);
    console.log(
      `已导入「${pack.name}」：${pack.trees.length} 棵学习树、${pack.nodes.length} 个知识点，数据库版本 ${result.revision}。`,
    );
  } finally {
    database.close();
  }
}
