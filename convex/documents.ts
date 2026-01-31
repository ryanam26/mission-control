import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// List documents
export const list = query({
  args: { type: v.optional(v.string()), taskId: v.optional(v.id("tasks")) },
  handler: async (ctx, args) => {
    if (args.taskId) {
      return await ctx.db
        .query("documents")
        .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
        .collect();
    }
    if (args.type) {
      return await ctx.db
        .query("documents")
        .withIndex("by_type", (q) => q.eq("type", args.type as any))
        .collect();
    }
    return await ctx.db.query("documents").order("desc").collect();
  },
});

// Get a document
export const get = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.documentId);
  },
});

// Create a document
export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    taskId: v.optional(v.id("tasks")),
    authorId: v.string(),
    authorName: v.string(),
    type: v.union(
      v.literal("draft"),
      v.literal("research"),
      v.literal("report"),
      v.literal("template"),
      v.literal("deliverable"),
      v.literal("note")
    ),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const docId = await ctx.db.insert("documents", {
      ...args,
      version: 1,
    });

    // Log activity
    await ctx.db.insert("activity", {
      type: "document_created",
      agentId: args.authorId,
      agentName: args.authorName,
      message: `Created document: ${args.title}`,
      taskId: args.taskId,
    });

    return docId;
  },
});

// Update a document
export const update = mutation({
  args: {
    documentId: v.id("documents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("research"),
        v.literal("report"),
        v.literal("template"),
        v.literal("deliverable"),
        v.literal("note")
      )
    ),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { documentId, ...updates } = args;
    const doc = await ctx.db.get(documentId);
    if (!doc) throw new Error("Document not found");

    const cleanUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) cleanUpdates[key] = value;
    }
    cleanUpdates.version = (doc.version || 1) + 1;

    await ctx.db.patch(documentId, cleanUpdates);
  },
});
