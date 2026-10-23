import type { Viewport } from "@xyflow/react";

/** Camera preferences are local UI state, separate from SQLite learning records. */
export type TreeViewport = Viewport & { width: number; height: number };
const prefix = "learning-tree:viewport:v1:";
const memory = new Map<string, TreeViewport>();
const pending = new Map<string, ReturnType<typeof setTimeout>>();
const storageKey = (treeId: string, compact: boolean) =>
  `${prefix}${compact ? "overview" : "map"}:${encodeURIComponent(treeId)}`;

function isViewport(value: unknown): value is TreeViewport {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<TreeViewport>;
  return (
    [v.x, v.y, v.zoom, v.width, v.height].every(
      (n) => typeof n === "number" && Number.isFinite(n),
    ) &&
    v.zoom! >= 0.1 &&
    v.zoom! <= 1.6 &&
    v.width! > 0 &&
    v.height! > 0
  );
}

export function readTreeViewport(treeId: string, compact: boolean) {
  const key = storageKey(treeId, compact);
  const cached = memory.get(key);
  if (cached) return { ...cached };
  try {
    const raw = localStorage.getItem(key);
    const value: unknown = raw ? JSON.parse(raw) : undefined;
    if (isViewport(value)) {
      memory.set(key, value);
      return { ...value };
    }
  } catch {
    // Unavailable browser storage must not prevent opening a tree.
  }
  return undefined;
}

function flush(key: string) {
  const timer = pending.get(key);
  if (timer !== undefined) clearTimeout(timer);
  pending.delete(key);
  const value = memory.get(key);
  if (!value) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // In-memory restoration remains available when storage is restricted/full.
  }
}

export function rememberTreeViewport(
  treeId: string,
  compact: boolean,
  viewport: TreeViewport,
) {
  if (!isViewport(viewport)) return;
  const key = storageKey(treeId, compact);
  memory.set(key, { ...viewport });
  const timer = pending.get(key);
  if (timer !== undefined) clearTimeout(timer);
  pending.set(
    key,
    setTimeout(() => flush(key), 200),
  );
}

export function flushTreeViewport(treeId: string, compact: boolean) {
  flush(storageKey(treeId, compact));
}

/** Preserve the same point at screen center if the canvas size has changed. */
export function restoreTreeViewport(
  saved: TreeViewport,
  width: number,
  height: number,
): Viewport {
  return {
    x: saved.x + (width - saved.width) / 2,
    y: saved.y + (height - saved.height) / 2,
    zoom: saved.zoom,
  };
}
