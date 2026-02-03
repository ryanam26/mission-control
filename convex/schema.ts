import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Agent registry — who's on the team
  agents: defineTable({
    agentId: v.string(), // e.g., "roy", "scout", "arrow"
    name: v.string(), // Display name
    emoji: v.string(), // 🦊, 🔍, 📧
    role: v.string(), // "Squad Lead", "Research & Intel", etc.
    description: v.string(), // What this agent does
    status: v.union(
      v.literal("active"),
      v.literal("idle"),
      v.literal("working"),
      v.literal("error"),
      v.literal("offline")
    ),
    level: v.union(
      v.literal("intern"),
      v.literal("specialist"),
      v.literal("lead")
    ),
    sessionKey: v.string(), // e.g., "agent:scout:main"
    currentTask: v.optional(v.string()), // Current task ID
    lastHeartbeat: v.optional(v.number()), // Timestamp
    lastActive: v.optional(v.number()), // Last time agent did something
    model: v.optional(v.string()), // Which AI model this agent uses
    heartbeatSchedule: v.optional(v.string()), // Cron expression
    config: v.optional(v.any()), // Extra config
  })
    .index("by_agentId", ["agentId"])
    .index("by_status", ["status"]),

  // Tasks — the shared kanban board
  // Flow: backlog → refining → todo → in_progress → review → done
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("backlog"),      // Raw ideas, needs refinement
      v.literal("refining"),     // Spec/Scout doing research, analysis, planning
      v.literal("todo"),         // Ready for dev (after QA review of refining)
      v.literal("in_progress"),  // Actively being worked
      v.literal("review"),       // Work done, needs human review
      v.literal("done"),         // Shipped
      v.literal("blocked")       // Stuck on something
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    assignees: v.array(v.string()), // Agent IDs
    createdBy: v.string(), // Agent ID or "human"
    labels: v.optional(v.array(v.string())),
    dueDate: v.optional(v.number()),
    blockedReason: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    metadata: v.optional(v.any()), // Flexible extra data
  })
    .index("by_status", ["status"])
    .index("by_assignees", ["assignees"])
    .index("by_createdBy", ["createdBy"]),

  // Comments — threaded discussion on tasks
  comments: defineTable({
    taskId: v.id("tasks"),
    authorId: v.string(), // Agent ID or "human"
    authorName: v.string(), // Display name
    authorEmoji: v.optional(v.string()),
    content: v.string(),
    mentions: v.optional(v.array(v.string())), // @mentioned agent IDs
    parentCommentId: v.optional(v.id("comments")), // For nested replies
    metadata: v.optional(v.any()),
  })
    .index("by_taskId", ["taskId"])
    .index("by_authorId", ["authorId"]),

  // Activity feed — real-time log of everything
  activity: defineTable({
    type: v.union(
      v.literal("task_created"),
      v.literal("task_updated"),
      v.literal("task_moved"),
      v.literal("comment_added"),
      v.literal("agent_heartbeat"),
      v.literal("agent_status_change"),
      v.literal("assignment_changed"),
      v.literal("document_created"),
      v.literal("mention"),
      v.literal("system")
    ),
    agentId: v.string(), // Who did it
    agentName: v.string(),
    agentEmoji: v.optional(v.string()),
    message: v.string(), // Human-readable description
    taskId: v.optional(v.id("tasks")),
    commentId: v.optional(v.id("comments")),
    metadata: v.optional(v.any()),
  })
    .index("by_agentId", ["agentId"])
    .index("by_type", ["type"]),

  // Notifications — @mentions and alerts
  notifications: defineTable({
    targetAgentId: v.string(), // Who should see this
    sourceAgentId: v.string(), // Who triggered it
    type: v.union(
      v.literal("mention"),
      v.literal("assignment"),
      v.literal("thread_update"),
      v.literal("review_request"),
      v.literal("system")
    ),
    message: v.string(),
    taskId: v.optional(v.id("tasks")),
    commentId: v.optional(v.id("comments")),
    read: v.boolean(),
    delivered: v.boolean(), // Has it been pushed to the agent's session?
    deliveredAt: v.optional(v.number()),
  })
    .index("by_target", ["targetAgentId"])
    .index("by_target_unread", ["targetAgentId", "read"])
    .index("by_target_undelivered", ["targetAgentId", "delivered"]),

  // Thread subscriptions — auto-subscribe when you interact
  subscriptions: defineTable({
    taskId: v.id("tasks"),
    agentId: v.string(),
    reason: v.union(
      v.literal("commented"),
      v.literal("mentioned"),
      v.literal("assigned"),
      v.literal("manual")
    ),
  })
    .index("by_taskId", ["taskId"])
    .index("by_agentId", ["agentId"])
    .index("by_task_agent", ["taskId", "agentId"]),

  // Documents — deliverables and shared files
  documents: defineTable({
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
    version: v.optional(v.number()),
  })
    .index("by_taskId", ["taskId"])
    .index("by_authorId", ["authorId"])
    .index("by_type", ["type"]),
});
