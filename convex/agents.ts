import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// List all agents
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

// Get agent by agentId
export const get = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();
  },
});

// Register or update an agent
export const upsert = mutation({
  args: {
    agentId: v.string(),
    name: v.string(),
    emoji: v.string(),
    role: v.string(),
    description: v.string(),
    level: v.union(
      v.literal("intern"),
      v.literal("specialist"),
      v.literal("lead")
    ),
    sessionKey: v.string(),
    model: v.optional(v.string()),
    heartbeatSchedule: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        status: existing.status,
        lastHeartbeat: existing.lastHeartbeat,
        lastActive: existing.lastActive,
        currentTask: existing.currentTask,
      });
      return existing._id;
    }

    return await ctx.db.insert("agents", {
      ...args,
      status: "idle",
      lastHeartbeat: Date.now(),
      lastActive: Date.now(),
    });
  },
});

// Update agent status
export const updateStatus = mutation({
  args: {
    agentId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("idle"),
      v.literal("working"),
      v.literal("error"),
      v.literal("offline")
    ),
    currentTask: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();
    if (!agent) throw new Error(`Agent ${args.agentId} not found`);

    await ctx.db.patch(agent._id, {
      status: args.status,
      currentTask: args.currentTask,
      lastActive: Date.now(),
    });

    // Log activity
    await ctx.db.insert("activity", {
      type: "agent_status_change",
      agentId: args.agentId,
      agentName: agent.name,
      agentEmoji: agent.emoji,
      message: `${agent.emoji} ${agent.name} is now ${args.status}${args.currentTask ? ` — working on task` : ""}`,
      metadata: { status: args.status },
    });
  },
});

// Record heartbeat
export const heartbeat = mutation({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();
    if (!agent) throw new Error(`Agent ${args.agentId} not found`);

    await ctx.db.patch(agent._id, {
      lastHeartbeat: Date.now(),
      lastActive: Date.now(),
    });
  },
});
