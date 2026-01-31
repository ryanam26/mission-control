import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// List comments for a task
export const listByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comments")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});

// Add a comment (with @mention detection and thread subscription)
export const add = mutation({
  args: {
    taskId: v.id("tasks"),
    authorId: v.string(),
    authorName: v.string(),
    authorEmoji: v.optional(v.string()),
    content: v.string(),
    mentions: v.optional(v.array(v.string())),
    parentCommentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    // Detect @mentions in content
    const mentionRegex = /@(\w+)/g;
    const detectedMentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(args.content)) !== null) {
      detectedMentions.push(match[1].toLowerCase());
    }
    const allMentions = [
      ...new Set([...(args.mentions || []), ...detectedMentions]),
    ];

    // Create comment
    const commentId = await ctx.db.insert("comments", {
      taskId: args.taskId,
      authorId: args.authorId,
      authorName: args.authorName,
      authorEmoji: args.authorEmoji,
      content: args.content,
      mentions: allMentions,
      parentCommentId: args.parentCommentId,
    });

    // Log activity
    await ctx.db.insert("activity", {
      type: "comment_added",
      agentId: args.authorId,
      agentName: args.authorName,
      agentEmoji: args.authorEmoji,
      message: `Commented on "${task.title}": ${args.content.slice(0, 100)}${args.content.length > 100 ? "..." : ""}`,
      taskId: args.taskId,
      commentId,
    });

    // Auto-subscribe the commenter
    const existingSub = await ctx.db
      .query("subscriptions")
      .withIndex("by_task_agent", (q) =>
        q.eq("taskId", args.taskId).eq("agentId", args.authorId)
      )
      .first();

    if (!existingSub) {
      await ctx.db.insert("subscriptions", {
        taskId: args.taskId,
        agentId: args.authorId,
        reason: "commented",
      });
    }

    // Handle @mentions — subscribe + notify
    for (const mentionedId of allMentions) {
      if (mentionedId === "all") {
        // @all — notify every agent
        const agents = await ctx.db.query("agents").collect();
        for (const agent of agents) {
          if (agent.agentId !== args.authorId) {
            await ctx.db.insert("notifications", {
              targetAgentId: agent.agentId,
              sourceAgentId: args.authorId,
              type: "mention",
              message: `${args.authorName} mentioned @all on "${task.title}": ${args.content.slice(0, 80)}`,
              taskId: args.taskId,
              commentId,
              read: false,
              delivered: false,
            });
          }
        }
        continue;
      }

      // Subscribe mentioned agent
      const mentionSub = await ctx.db
        .query("subscriptions")
        .withIndex("by_task_agent", (q) =>
          q.eq("taskId", args.taskId).eq("agentId", mentionedId)
        )
        .first();

      if (!mentionSub) {
        await ctx.db.insert("subscriptions", {
          taskId: args.taskId,
          agentId: mentionedId,
          reason: "mentioned",
        });
      }

      // Notify mentioned agent
      if (mentionedId !== args.authorId) {
        await ctx.db.insert("notifications", {
          targetAgentId: mentionedId,
          sourceAgentId: args.authorId,
          type: "mention",
          message: `${args.authorName} mentioned you on "${task.title}": ${args.content.slice(0, 80)}`,
          taskId: args.taskId,
          commentId,
          read: false,
          delivered: false,
        });
      }
    }

    // Notify all thread subscribers (except author and already-notified mentions)
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .collect();

    const alreadyNotified = new Set([args.authorId, ...allMentions]);
    for (const sub of subs) {
      if (!alreadyNotified.has(sub.agentId)) {
        await ctx.db.insert("notifications", {
          targetAgentId: sub.agentId,
          sourceAgentId: args.authorId,
          type: "thread_update",
          message: `${args.authorName} commented on "${task.title}": ${args.content.slice(0, 80)}`,
          taskId: args.taskId,
          commentId,
          read: false,
          delivered: false,
        });
      }
    }

    return commentId;
  },
});
