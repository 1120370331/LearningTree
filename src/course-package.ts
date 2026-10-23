import { z } from "zod";
import {
  emptyCard,
  nodeSchema,
  parseData,
  treeSchema,
  type Data,
} from "./domain.ts";

/** Course packages contain authored content, never a learner's notes or scores. */
export const coursePackageSchema = z
  .object({
    format: z.literal("learning-tree-course"),
    version: z.literal(1),
    name: z.string().trim().min(1).max(100),
    release: z.string().trim().max(60).optional(),
    trees: z
      .array(
        treeSchema.omit({ createdAt: true }).extend({
          description: treeSchema.shape.description.default(""),
          color: treeSchema.shape.color.default("blue"),
        }),
      )
      .min(1)
      .max(100),
    nodes: z
      .array(
        nodeSchema
          .omit({ note: true, card: true, createdAt: true, learnedAt: true })
          .extend({
            parentId: nodeSchema.shape.parentId.default(null),
            question: nodeSchema.shape.question.default(""),
            answer: nodeSchema.shape.answer.default(""),
            resource: nodeSchema.shape.resource.default(""),
          }),
      )
      .max(1000),
  })
  .superRefine((pack, ctx) => {
    for (const items of [pack.trees, pack.nodes]) {
      if (new Set(items.map((item) => item.id)).size !== items.length) {
        ctx.addIssue({ code: "custom", message: "课程包中存在重复 ID" });
      }
    }
  });

export type CoursePackage = z.infer<typeof coursePackageSchema>;
export function parseCoursePackage(input: unknown): CoursePackage {
  return coursePackageSchema.parse(input);
}

export function mergeCoursePackage(
  data: Data,
  pack: CoursePackage,
  now = new Date(),
): Data {
  const trees = new Map(data.trees.map((tree) => [tree.id, tree]));
  const nodes = new Map(data.nodes.map((node) => [node.id, node]));
  for (const tree of pack.trees) {
    const previous = trees.get(tree.id);
    trees.set(tree.id, {
      ...tree,
      createdAt: previous?.createdAt ?? now.toISOString(),
    });
  }
  for (const node of pack.nodes) {
    const previous = nodes.get(node.id);
    const sameRecall =
      previous?.question === node.question && previous?.answer === node.answer;
    nodes.set(node.id, {
      ...node,
      note: previous?.note ?? "",
      ...(previous?.learnedAt ? { learnedAt: previous.learnedAt } : {}),
      card: previous && sameRecall ? previous.card : emptyCard(now),
      createdAt: previous?.createdAt ?? now.toISOString(),
    });
  }
  // Validate the combined graph, including dependencies on previously imported courses.
  // Omitted nodes stay in place so a course update cannot silently erase study history.
  return parseData({
    ...data,
    trees: [...trees.values()],
    nodes: [...nodes.values()],
  });
}
