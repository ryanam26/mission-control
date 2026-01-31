import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get subscribers for a task
export const getForTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});

// Get tasks an agent is subscribed to
export const getForAgent = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .collect();
  },
});

// Subscribe to a task
export const subscribe = mutation({
  args: {
    taskId: v.id("tasks"),
    agentId: v.string(),
    reason: v.union(
      v.literal("commented"),
      v.literal("mentioned"),
      v.literal("assigned"),
      v.literal("manual")
    ),
  },
  handler: async (ctx, args) => {
    // Check if already subscribed
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_task_agent", (q) =>
        q.eq("taskId", args.taskId).eq("agentId", args.agentId)
      )
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("subscriptions", args);
  },
});

// Unsubscribe from a task
export const unsubscribe = mutation({
  args: {
    taskId: v.id("tasks"),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_task_agent", (q) =>
        q.eq("taskId", args.taskId).eq("agentId", args.agentId)
      )
      .first();

    if (sub) await ctx.db.delete(sub._id);
  },
});
