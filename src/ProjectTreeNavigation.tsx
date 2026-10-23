import {
  Check,
  ChevronRight,
  Folder,
  FolderOpen,
  GitBranch,
} from "lucide-react";
import type { Data, Tree } from "./domain";
import { treeProgress } from "./progression";

export function ProjectTreeNavigation({
  data,
  selectedId,
  collapsedIds,
  onToggle,
  onSelect,
}: {
  data: Data;
  selectedId?: string;
  collapsedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const children = new Map<string | null, Tree[]>();
  const byId = new Map(data.trees.map((tree) => [tree.id, tree]));
  for (const tree of data.trees) {
    const siblings = children.get(tree.parentTreeId) ?? [];
    siblings.push(tree);
    children.set(tree.parentTreeId, siblings);
  }
  const ancestors = new Set<string>();
  let parent = selectedId ? byId.get(selectedId)?.parentTreeId : undefined;
  while (parent && !ancestors.has(parent)) {
    ancestors.add(parent);
    parent = byId.get(parent)?.parentTreeId;
  }

  function branch(trees: Tree[], depth: number) {
    return (
      <ul className="project-hierarchy-list">
        {trees.map((tree) => {
          const descendants = children.get(tree.id) ?? [];
          const expanded = !collapsedIds.has(tree.id);
          const active = selectedId === tree.id;
          const Icon =
            depth === 0
              ? descendants.length && expanded
                ? FolderOpen
                : Folder
              : GitBranch;
          const progress = treeProgress(data, tree.id);
          const childrenId = `project-children-${encodeURIComponent(tree.id)}`;
          return (
            <li key={tree.id}>
              <div
                className={`project-hierarchy-row ${depth === 0 ? "is-project" : "is-tree"} ${active ? "is-current" : ""} ${ancestors.has(tree.id) ? "is-ancestor" : ""}`}
              >
                {descendants.length ? (
                  <button
                    type="button"
                    className="project-branch-toggle"
                    aria-label={`${expanded ? "收起" : "展开"}${tree.title}的下属学习树`}
                    aria-expanded={expanded}
                    aria-controls={childrenId}
                    onClick={() => onToggle(tree.id)}
                  >
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <span className="project-branch-spacer" aria-hidden="true" />
                )}
                <button
                  type="button"
                  className="project-branch-link"
                  aria-current={active ? "page" : undefined}
                  onClick={() => onSelect(tree.id)}
                  title={tree.title}
                >
                  <Icon size={16} />
                  <span className="project-branch-copy">
                    <strong>{tree.title}</strong>
                    <small>
                      {depth === 0 ? "学习项目" : "学习树"}
                      {descendants.length > 0 &&
                        ` · ${descendants.length} 棵下属树`}{" "}
                      · {progress.total} 个知识点
                    </small>
                  </span>
                  {active && <Check size={14} aria-hidden="true" />}
                </button>
              </div>
              {descendants.length > 0 && (
                <div id={childrenId} hidden={!expanded}>
                  {branch(descendants, depth + 1)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <nav className="project-hierarchy" aria-label="学习项目与下属学习树">
      {branch(children.get(null) ?? [], 0)}
      {!data.trees.length && (
        <p className="project-hierarchy-empty">
          还没有学习项目，可新建项目或导入课程包。
        </p>
      )}
    </nav>
  );
}
