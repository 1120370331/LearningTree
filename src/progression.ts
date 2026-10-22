import { nodeScore, type Data, type Topic } from "./domain";

export type SkillState = "locked" | "available" | "learning" | "verified" | "consolidated";
export const skillLabels: Record<SkillState, string> = {
  locked: "前置未完成", available: "可以挑战", learning: "正在探索", verified: "验证通过", consolidated: "已回忆巩固",
};
export function evidence(data: Data, nodeId: string) {
  const sessions = data.sessions.filter(s => s.nodeId === nodeId).sort((a, b) => b.at.localeCompare(a.at));
  const tests = sessions.filter(s => s.total !== null).slice(0, 5);
  const questions = tests.reduce((sum, s) => sum + (s.total ?? 0), 0);
  const score = nodeScore(data, nodeId);
  const verified = score !== null && score >= 80 && questions >= 5;
  const recall = verified && data.reviews.some(r => r.nodeId === nodeId && r.rating >= 3 && r.at >= tests[0].at);
  return { score, questions, sessions: sessions.length, minutes: sessions.reduce((sum,s) => sum+s.minutes,0), verified, rank: recall ? 3 : verified ? 2 : sessions.length || data.reviews.some(r=>r.nodeId===nodeId) ? 1 : 0 };
}
export function skillState(data: Data, node: Topic): SkillState {
  const progress = evidence(data, node.id);
  if (progress.rank === 3) return "consolidated";
  if (progress.rank === 2) return "verified";
  if (progress.rank === 1) return "learning";
  return !node.parentId || evidence(data, node.parentId).verified ? "available" : "locked";
}
export function routeTo(data: Data, id: string) {
  const path: Topic[] = [], seen = new Set<string>();
  let node = data.nodes.find(n=>n.id===id);
  while (node && !seen.has(node.id)) { path.unshift(node); seen.add(node.id); node=data.nodes.find(n=>n.id===node!.parentId); }
  return path;
}
export function nextSkill(data: Data, treeId: string) {
  const nodes=data.nodes.filter(n=>n.treeId===treeId);
  return nodes.find(n=>skillState(data,n)==="learning") ?? nodes.find(n=>skillState(data,n)==="available") ?? nodes[0];
}
export function newlyUnlocked(before: Data, after: Data) {
  return after.nodes.filter(node => {
    const previous=before.nodes.find(n=>n.id===node.id);
    return previous && skillState(before,previous)==="locked" && skillState(after,node)==="available";
  });
}
