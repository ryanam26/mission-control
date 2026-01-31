import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get undelivered notifications for an agent (used by notification daemon)
export const getUndelivered = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_target_undelivered", (q) =>
        q.eq("targetAgentId", args.agentId).eq("delivered", false)
      )
      .collect();
  },
});

// Get unread notifications for an agent
export const getUnread = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_target_unread", (q) =>
        q.eq("targetAgentId", args.agentId).eq("read", false)
      )
      .collect();
  },
});

// Get all notifications for an agent (for UI)
export const listForAgent = query({
  args: { agentId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("notifications")
      .withIndex("by_target", (q) => q.eq("targetAgentId", args.agentId))
      .order("desc")
      .take(limit);
  },
});

// Mark notification as delivered
export const markDelivered = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      delivered: true,
      deliveredAt: Date.now(),
    });
  },
});

// Mark notifications as read
export const markRead = mutation({
  args: { notificationIds: v.array(v.id("notifications")) },
  handler: async (ctx, args) => {
    for (const id of args.notificationIds) {
      await ctx.db.patch(id, { read: true });
    }
  },
});

// Mark all as read for an agent
export const markAllRead = mutation({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_target_unread", (q) =>
        q.eq("targetAgentId", args.agentId).eq("read", false)
      )
      .collect();

    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
    return unread.length;
  },
});
