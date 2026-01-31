import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get recent activity (latest first)
export const recent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("activity")
      .order("desc")
      .take(limit);
  },
});

// Get activity for a specific agent
export const byAgent = query({
  args: { agentId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    return await ctx.db
      .query("activity")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(limit);
  },
});

// Get activity for a specific task
export const byTask = query({
  args: { taskId: v.id("tasks"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const all = await ctx.db
      .query("activity")
      .order("desc")
      .take(500);
    return all
      .filter((a) => a.taskId === args.taskId)
      .slice(0, limit);
  },
});

// Log a system activity
export const logSystem = mutation({
  args: {
    agentId: v.string(),
    agentName: v.string(),
    agentEmoji: v.optional(v.string()),
    message: v.string(),
    taskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activity", {
      type: "system",
      agentId: args.agentId,
      agentName: args.agentName,
      agentEmoji: args.agentEmoji,
      message: args.message,
      taskId: args.taskId,
    });
  },
});
