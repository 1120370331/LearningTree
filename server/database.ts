import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { blankData, parseData, type Data } from "../src/domain.ts";
import {
  mergeCoursePackage,
  type CoursePackage,
} from "../src/course-package.ts";

export interface Workspace {
  data: Data | null;
  revision: number;
  updatedAt: string | null;
}
export interface BuiltinCourse {
  id: string;
  pack: CoursePackage;
}
export class RevisionConflict extends Error {
  constructor() {
    super("数据库中有更新，当前修改未保存。请载入最新数据后重试。");
  }
}

export class LearningDatabase {
  private db: DatabaseSync;
  private builtin?: BuiltinCourse;

  constructor(path: string, builtin?: BuiltinCourse) {
    mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(
      "PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL; PRAGMA busy_timeout = 5000;",
    );
    const version = Number(
      this.db.prepare("PRAGMA user_version").get()?.user_version ?? 0,
    );
    if (version > 3)
      throw new Error("数据库版本高于当前应用版本，请使用更新的应用打开。");
    if (version === 0) this.migrate();
    if (version < 2) {
      this.db.exec(`BEGIN IMMEDIATE;
        CREATE TABLE IF NOT EXISTS installed_builtins (
          package_id TEXT PRIMARY KEY,
          release TEXT NOT NULL,
          installed_at TEXT NOT NULL
        ) STRICT;
        PRAGMA user_version = 2;
        COMMIT;`);
    }
    if (version < 3) {
      this.db.exec(`BEGIN IMMEDIATE;
        ALTER TABLE topic_progress ADD COLUMN learned_at TEXT;
        PRAGMA user_version = 3;
        COMMIT;`);
    }
    this.builtin = builtin;
    // Existing databases receive the built-in once. Fresh databases defer this
    // until their first save, so browser-data migration can happen in the same transaction.
    if (builtin && !this.builtinInstalled()) {
      const current = this.read();
      if (current.data) this.save(current.data, current.revision);
    }
  }

  private builtinInstalled() {
    return (
      !this.builtin ||
      !!this.db
        .prepare("SELECT package_id FROM installed_builtins WHERE package_id=?")
        .get(this.builtin.id)
    );
  }

  private migrate() {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS workspace_meta (
          id INTEGER PRIMARY KEY CHECK(id = 1),
          revision INTEGER NOT NULL DEFAULT 0,
          initialized INTEGER NOT NULL DEFAULT 0,
          demo INTEGER NOT NULL DEFAULT 0,
          settings_json TEXT NOT NULL,
          updated_at TEXT
        ) STRICT;
        CREATE TABLE IF NOT EXISTS courses (
          id TEXT PRIMARY KEY,
          position INTEGER NOT NULL,
          payload_json TEXT NOT NULL
        ) STRICT;
        CREATE TABLE IF NOT EXISTS topics (
          id TEXT PRIMARY KEY,
          tree_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          position INTEGER NOT NULL,
          payload_json TEXT NOT NULL
        ) STRICT;
        CREATE TABLE IF NOT EXISTS topic_progress (
          node_id TEXT PRIMARY KEY REFERENCES topics(id) ON DELETE CASCADE,
          note TEXT NOT NULL,
          card_json TEXT NOT NULL
        ) STRICT;
        CREATE TABLE IF NOT EXISTS study_sessions (
          id TEXT PRIMARY KEY,
          node_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
          occurred_at TEXT NOT NULL,
          position INTEGER NOT NULL,
          payload_json TEXT NOT NULL
        ) STRICT;
        CREATE TABLE IF NOT EXISTS review_events (
          id TEXT PRIMARY KEY,
          node_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
          occurred_at TEXT NOT NULL,
          position INTEGER NOT NULL,
          payload_json TEXT NOT NULL
        ) STRICT;
        CREATE INDEX IF NOT EXISTS topics_tree ON topics(tree_id);
        CREATE INDEX IF NOT EXISTS sessions_node_time ON study_sessions(node_id, occurred_at);
        CREATE INDEX IF NOT EXISTS reviews_node_time ON review_events(node_id, occurred_at);
        CREATE TABLE IF NOT EXISTS course_imports (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          imported_at TEXT NOT NULL,
          revision INTEGER NOT NULL,
          tree_count INTEGER NOT NULL,
          topic_count INTEGER NOT NULL
        ) STRICT;
        PRAGMA user_version = 1;
      `);
      this.db
        .prepare(
          "INSERT OR IGNORE INTO workspace_meta(id, settings_json) VALUES (1, ?)",
        )
        .run(JSON.stringify(blankData().settings));
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  read(): Workspace {
    this.db.exec("BEGIN");
    try {
      const meta = this.db
        .prepare("SELECT * FROM workspace_meta WHERE id = 1")
        .get();
      if (!meta) throw new Error("数据库缺少工作区元信息。");
      const result: Workspace = {
        data: null,
        revision: Number(meta.revision),
        updatedAt: meta.updated_at === null ? null : String(meta.updated_at),
      };
      if (meta.initialized) {
        const payloads = (table: string) =>
          this.db
            .prepare(`SELECT payload_json FROM ${table} ORDER BY position`)
            .all()
            .map((row) => JSON.parse(String(row.payload_json)));
        const topics = this.db
          .prepare(
            `SELECT t.payload_json, p.note, p.card_json, p.learned_at FROM topics t
          LEFT JOIN topic_progress p ON p.node_id = t.id ORDER BY t.position`,
          )
          .all();
        result.data = parseData({
          version: 1,
          demo: Boolean(meta.demo),
          settings: JSON.parse(String(meta.settings_json)),
          trees: payloads("courses"),
          nodes: topics.map((row) => ({
            ...JSON.parse(String(row.payload_json)),
            note: row.note,
            card: JSON.parse(String(row.card_json)),
            ...(row.learned_at ? { learnedAt: String(row.learned_at) } : {}),
          })),
          sessions: payloads("study_sessions"),
          reviews: payloads("review_events"),
        });
      }
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  save(
    input: Data,
    expectedRevision: number,
    imported?: CoursePackage,
  ): Workspace {
    let data = parseData(input);
    const updatedAt = new Date().toISOString();
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const actual = Number(
        this.db
          .prepare("SELECT revision FROM workspace_meta WHERE id = 1")
          .get()?.revision,
      );
      if (actual !== expectedRevision) throw new RevisionConflict();
      const installing =
        this.builtin && !this.builtinInstalled() ? this.builtin : undefined;
      if (installing) {
        data = mergeCoursePackage(data, installing.pack);
        const builtInIds = new Set(
          installing.pack.trees.map((tree) => tree.id),
        );
        data.trees = [
          ...data.trees.filter((tree) => builtInIds.has(tree.id)),
          ...data.trees.filter((tree) => !builtInIds.has(tree.id)),
        ];
      }
      const tree = this.db
        .prepare(`INSERT INTO courses(id, position, payload_json) VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET position=excluded.position, payload_json=excluded.payload_json
        WHERE courses.position != excluded.position OR courses.payload_json != excluded.payload_json`);
      data.trees.forEach((item, position) =>
        tree.run(item.id, position, JSON.stringify(item)),
      );
      const topic = this.db
        .prepare(`INSERT INTO topics(id, tree_id, position, payload_json) VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET tree_id=excluded.tree_id, position=excluded.position, payload_json=excluded.payload_json
        WHERE topics.tree_id != excluded.tree_id OR topics.position != excluded.position OR topics.payload_json != excluded.payload_json`);
      const progress = this.db
        .prepare(`INSERT INTO topic_progress(node_id, note, card_json, learned_at) VALUES (?, ?, ?, ?)
        ON CONFLICT(node_id) DO UPDATE SET note=excluded.note, card_json=excluded.card_json, learned_at=excluded.learned_at
        WHERE topic_progress.note != excluded.note OR topic_progress.card_json != excluded.card_json OR topic_progress.learned_at IS NOT excluded.learned_at`);
      data.nodes.forEach(({ note, card, learnedAt, ...content }, position) => {
        topic.run(
          content.id,
          content.treeId,
          position,
          JSON.stringify(content),
        );
        progress.run(content.id, note, JSON.stringify(card), learnedAt ?? null);
      });
      for (const [table, records] of [
        ["study_sessions", data.sessions],
        ["review_events", data.reviews],
      ] as const) {
        const put = this.db
          .prepare(`INSERT INTO ${table}(id, node_id, occurred_at, position, payload_json) VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET node_id=excluded.node_id, occurred_at=excluded.occurred_at, position=excluded.position, payload_json=excluded.payload_json
          WHERE ${table}.position != excluded.position OR ${table}.payload_json != excluded.payload_json`);
        records.forEach((item, position) =>
          put.run(
            item.id,
            item.nodeId,
            item.at,
            position,
            JSON.stringify(item),
          ),
        );
        this.removeAbsent(table, new Set(records.map((item) => item.id)));
      }
      this.removeAbsent("topics", new Set(data.nodes.map((item) => item.id)));
      this.removeAbsent("courses", new Set(data.trees.map((item) => item.id)));
      if (data.trees.length === 0) this.db.exec("DELETE FROM course_imports");
      const revision = actual + 1;
      this.db
        .prepare(
          "UPDATE workspace_meta SET revision=?, initialized=1, demo=?, settings_json=?, updated_at=? WHERE id=1",
        )
        .run(
          revision,
          data.demo ? 1 : 0,
          JSON.stringify(data.settings),
          updatedAt,
        );
      if (imported)
        this.db
          .prepare(
            "INSERT INTO course_imports(name, imported_at, revision, tree_count, topic_count) VALUES (?, ?, ?, ?, ?)",
          )
          .run(
            imported.name,
            updatedAt,
            revision,
            imported.trees.length,
            imported.nodes.length,
          );
      if (installing) {
        this.db
          .prepare(
            "INSERT INTO installed_builtins(package_id, release, installed_at) VALUES (?, ?, ?)",
          )
          .run(installing.id, installing.pack.release ?? "1", updatedAt);
        this.db
          .prepare(
            "INSERT INTO course_imports(name, imported_at, revision, tree_count, topic_count) VALUES (?, ?, ?, ?, ?)",
          )
          .run(
            installing.pack.name,
            updatedAt,
            revision,
            installing.pack.trees.length,
            installing.pack.nodes.length,
          );
      }
      this.db.exec("COMMIT");
      return { data, revision, updatedAt };
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  importCourse(pack: CoursePackage, expectedRevision: number) {
    const current = this.read();
    if (current.revision !== expectedRevision) throw new RevisionConflict();
    return this.save(
      mergeCoursePackage(current.data ?? blankData(), pack),
      expectedRevision,
      pack,
    );
  }

  private removeAbsent(
    table: "courses" | "topics" | "study_sessions" | "review_events",
    ids: Set<string>,
  ) {
    const remove = this.db.prepare(`DELETE FROM ${table} WHERE id = ?`);
    for (const row of this.db.prepare(`SELECT id FROM ${table}`).all()) {
      if (!ids.has(String(row.id))) remove.run(row.id);
    }
  }
  close() {
    this.db.close();
  }
}
