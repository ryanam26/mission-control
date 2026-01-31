import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// List tasks, optionally by status
export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_status", (q) => q.eq("status", args.status as any))
        .collect();
    }
    return await ctx.db.query("tasks").collect();
  },
});

// Get a single task
export const get = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});

// Create a task
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    assignees: v.optional(v.array(v.string())),
    createdBy: v.string(),
    labels: v.optional(v.array(v.string())),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const assignees = args.assignees || [];
    const status = assignees.length > 0 ? "assigned" : "inbox";

    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      status,
      priority: args.priority,
      assignees,
      createdBy: args.createdBy,
      labels: args.labels,
      dueDate: args.dueDate,
    });

    // Log activity
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.createdBy))
      .first();

    await ctx.db.insert("activity", {
      type: "task_created",
      agentId: args.createdBy,
      agentName: agent?.name || args.createdBy,
      agentEmoji: agent?.emoji,
      message: `Created task: ${args.title}`,
      taskId,
    });

    // Auto-subscribe creator
    await ctx.db.insert("subscriptions", {
      taskId,
      agentId: args.createdBy,
      reason: "commented",
    });

    // Auto-subscribe assignees + notify them
    for (const assigneeId of assignees) {
      await ctx.db.insert("subscriptions", {
        taskId,
        agentId: assigneeId,
        reason: "assigned",
      });

      if (assigneeId !== args.createdBy) {
        await ctx.db.insert("notifications", {
          targetAgentId: assigneeId,
          sourceAgentId: args.createdBy,
          type: "assignment",
          message: `You've been assigned to: ${args.title}`,
          taskId,
          read: false,
          delivered: false,
        });
      }
    }

    return taskId;
  },
});

// Move task to a new status
export const move = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(
      v.literal("inbox"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done"),
      v.literal("blocked")
    ),
    movedBy: v.string(),
    blockedReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const oldStatus = task.status;
    const updates: any = { status: args.status };

    if (args.status === "done") updates.completedAt = Date.now();
    if (args.status === "blocked") updates.blockedReason = args.blockedReason;

    await ctx.db.patch(args.taskId, updates);

    // Log activity
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.movedBy))
      .first();

    await ctx.db.insert("activity", {
      type: "task_moved",
      agentId: args.movedBy,
      agentName: agent?.name || args.movedBy,
      agentEmoji: agent?.emoji,
      message: `Moved "${task.title}" from ${oldStatus} → ${args.status}`,
      taskId: args.taskId,
    });

    // Notify all subscribers
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .collect();

    for (const sub of subs) {
      if (sub.agentId !== args.movedBy) {
        await ctx.db.insert("notifications", {
          targetAgentId: sub.agentId,
          sourceAgentId: args.movedBy,
          type: "thread_update",
          message: `Task "${task.title}" moved to ${args.status}`,
          taskId: args.taskId,
          read: false,
          delivered: false,
        });
      }
    }
  },
});

// Update task (assignees, priority, etc.)
export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("urgent")
      )
    ),
    assignees: v.optional(v.array(v.string())),
    labels: v.optional(v.array(v.string())),
    dueDate: v.optional(v.number()),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const { taskId, updatedBy, ...updates } = args;
    const task = await ctx.db.get(taskId);
    if (!task) throw new Error("Task not found");

    // Filter out undefined values
    const cleanUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) cleanUpdates[key] = value;
    }

    await ctx.db.patch(taskId, cleanUpdates);

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", updatedBy))
      .first();

    await ctx.db.insert("activity", {
      type: "task_updated",
      agentId: updatedBy,
      agentName: agent?.name || updatedBy,
      agentEmoji: agent?.emoji,
      message: `Updated task: ${task.title}`,
      taskId,
    });
  },
});
