import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z, ZodError } from "zod";
import { parseData } from "../src/domain.ts";
import { parseCoursePackage } from "../src/course-package.ts";
import { LearningDatabase, RevisionConflict } from "./database.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const port = Number(process.env.LEARNINGTREE_PORT ?? 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("LEARNINGTREE_PORT 必须为有效端口。");
const databasePath = resolve(
  root,
  process.env.LEARNINGTREE_DB_PATH ?? "data/learningtree.sqlite",
);
const builtinPackage = parseCoursePackage(
  JSON.parse(
    await readFile(
      resolve(root, "courses/builtin/frontend-tech-tree.json"),
      "utf8",
    ),
  ),
);
const database = new LearningDatabase(databasePath, {
  id: "builtin-frontend-tech-tree",
  pack: builtinPackage,
});
const dist = resolve(root, "dist");
const limit = 33 * 1024 * 1024;
const revisionSchema = z.number().int().nonnegative().safe();

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
function json(response: ServerResponse, status: number, payload: unknown) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(payload));
}
async function body(request: IncomingMessage) {
  if (
    !request.headers["content-type"]
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new HttpError(415, "请求内容必须为 JSON。");
  if (Number(request.headers["content-length"] ?? 0) > limit)
    throw new HttpError(413, "内容超过 32 MB，请拆分课程包。");
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += part.length;
    if (size > limit)
      throw new HttpError(413, "内容超过 32 MB，请拆分课程包。");
    chunks.push(part);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new HttpError(400, "无法读取 JSON 内容。");
  }
}
function localRequest(request: IncomingMessage) {
  const allowed = new Set(["127.0.0.1", "localhost", "[::1]"]);
  const host = new URL(`http://${request.headers.host ?? ""}`).hostname;
  if (!allowed.has(host)) throw new HttpError(403, "此服务仅接受本机访问。");
  const origin = request.headers.origin;
  if (origin && !allowed.has(new URL(origin).hostname))
    throw new HttpError(403, "不允许从其他站点修改学习数据。");
}
async function staticFile(
  pathname: string,
  response: ServerResponse,
  head: boolean,
) {
  const filename = resolve(dist, `.${decodeURIComponent(pathname)}`);
  const inside = relative(dist, filename);
  if (inside.startsWith("..") || isAbsolute(inside))
    throw new HttpError(403, "不能访问该路径。");
  let target = filename;
  try {
    if (!(await stat(target)).isFile()) target = resolve(dist, "index.html");
  } catch {
    if (extname(pathname)) throw new HttpError(404, "文件不存在。");
    target = resolve(dist, "index.html");
  }
  let content: Buffer;
  try {
    content = await readFile(target);
  } catch {
    throw new HttpError(
      503,
      "前端尚未构建。开发时使用 npm run dev，部署时先运行 npm run build。",
    );
  }
  const mime: Record<string, string> = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".json": "application/json",
    ".png": "image/png",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
  };
  response.writeHead(200, {
    "Content-Type": `${mime[extname(target)] ?? "application/octet-stream"}; charset=utf-8`,
    "Cache-Control": pathname.startsWith("/assets/")
      ? "public, max-age=31536000, immutable"
      : "no-cache",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(head ? undefined : content);
}
const server = createServer(async (request, response) => {
  try {
    localRequest(request);
    const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
    if (url.pathname === "/api/health" && request.method === "GET") {
      json(response, 200, { ok: true, storage: "sqlite" });
      return;
    }
    if (url.pathname === "/api/workspace" && request.method === "GET") {
      json(response, 200, database.read());
      return;
    }
    if (url.pathname === "/api/workspace" && request.method === "PUT") {
      const input = z
        .object({ expectedRevision: revisionSchema, data: z.unknown() })
        .parse(await body(request));
      json(
        response,
        200,
        database.save(parseData(input.data), input.expectedRevision),
      );
      return;
    }
    if (
      url.pathname === "/api/course-packages/import" &&
      request.method === "POST"
    ) {
      const input = z
        .object({ expectedRevision: revisionSchema, package: z.unknown() })
        .parse(await body(request));
      json(
        response,
        200,
        database.importCourse(
          parseCoursePackage(input.package),
          input.expectedRevision,
        ),
      );
      return;
    }
    if (
      url.pathname === "/api/course-packages/example" &&
      request.method === "GET"
    ) {
      json(
        response,
        200,
        JSON.parse(
          await readFile(
            resolve(root, "courses/builtin/frontend-tech-tree.json"),
            "utf8",
          ),
        ),
      );
      return;
    }
    if (url.pathname.startsWith("/api/"))
      throw new HttpError(404, "接口或请求方法不存在。");
    if (request.method !== "GET" && request.method !== "HEAD")
      throw new HttpError(405, "不支持此请求方法。");
    await staticFile(url.pathname, response, request.method === "HEAD");
  } catch (error) {
    if (response.headersSent || response.destroyed) return;
    if (error instanceof RevisionConflict) {
      json(response, 409, { error: error.message, code: "revision_conflict" });
      return;
    }
    if (error instanceof HttpError) {
      json(response, error.status, { error: error.message });
      return;
    }
    if (error instanceof ZodError) {
      const first = error.issues[0];
      const message =
        first && /[\u3400-\u9fff]/.test(first.message)
          ? first.message
          : "内容格式不完整或字段类型不正确。";
      json(response, 422, { error: message, code: "invalid_data" });
      return;
    }
    console.error("LearningTree request failed:", error);
    json(response, 500, {
      error: "数据库操作失败，当前修改未确认保存。请重试或查看后端日志。",
      code: "storage_error",
    });
  }
});
server.requestTimeout = 30000;
server.headersTimeout = 10000;
server.on("error", (error) => {
  console.error(error);
  database.close();
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => {
  console.log(`LearningTree API: http://127.0.0.1:${port}`);
  console.log(`SQLite: ${databasePath}`);
  process.send?.({ type: "ready" });
});
let closing = false;
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    if (closing) return;
    closing = true;
    server.close(() => {
      database.close();
      process.exit(0);
    });
    setTimeout(() => server.closeAllConnections(), 3000).unref();
  });
