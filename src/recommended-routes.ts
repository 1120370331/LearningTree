import type { Data, Topic } from "./domain";
import { evidence, treeBlockers, treeProgress } from "./progression";

// Curated orders complement the actual parent and cross-tree prerequisites.
export const builtinRoutes: Record<
  string,
  { title: string; nodeIds: string[] }
> = {
  web: {
    title: "前端开发 · 从基础到作品",
    nodeIds: [
      "html",
      "css",
      "box-model",
      "responsive",
      "grid",
      "accessibility",
      "js",
      "dom",
      "closure",
      "async",
      "network",
      "typescript",
      "react",
      "components",
      "testing",
      "project",
      "deploy",
    ],
  },
  data: {
    title: "数据分析 · 从清理到表达",
    nodeIds: ["python", "pandas", "charts"],
  },
  design: { title: "设计入门 · 从层次到对比", nodeIds: ["type", "color"] },
};

export function recommendedRoute(data: Data, treeId: string) {
  const nodes: Topic[] = [];
  const seenTrees = new Set<string>();
  const seenNodes = new Set<string>();
  const emptyTrees: string[] = [];
  const visitNode = (node: Topic) => {
    if (seenNodes.has(node.id)) return;
    seenNodes.add(node.id);
    const parent = data.nodes.find(
      (n) => n.id === node.parentId && n.treeId === node.treeId,
    );
    if (parent) visitNode(parent);
    nodes.push(node);
  };
  const visitTree = (id: string) => {
    if (seenTrees.has(id)) return;
    seenTrees.add(id);
    const tree = data.trees.find((t) => t.id === id);
    if (!tree) return;
    // Ancestor prerequisites also apply when entering a subtree directly.
    const ancestors = new Set<string>();
    let parent = data.trees.find((t) => t.id === tree.parentTreeId);
    while (parent && !ancestors.has(parent.id)) {
      ancestors.add(parent.id);
      parent.prerequisiteTreeIds.forEach(visitTree);
      parent = data.trees.find((t) => t.id === parent!.parentTreeId);
    }
    tree.prerequisiteTreeIds.forEach(visitTree);
    const topics = data.nodes.filter((n) => n.treeId === id);
    const order = builtinRoutes[id]?.nodeIds ?? [];
    order.forEach((nodeId) => {
      const node = topics.find((n) => n.id === nodeId);
      if (node) visitNode(node);
    });
    topics.forEach(visitNode);
    const children = data.trees.filter((t) => t.parentTreeId === id);
    if (!topics.length && !children.length) emptyTrees.push(id);
    children.forEach((t) => visitTree(t.id));
  };
  visitTree(treeId);
  const next = nodes.find(
    (n) =>
      !evidence(data, n.id).completed && !treeBlockers(data, n.treeId).length,
  );
  const blocked = data.trees.find(
    (t) => emptyTrees.includes(t.id) && !treeProgress(data, t.id).complete,
  );
  return {
    title: builtinRoutes[treeId]?.title ?? "先前置，再进阶",
    nodes,
    next,
    blocked,
    completed: nodes.filter((n) => evidence(data, n.id).completed).length,
  };
}
