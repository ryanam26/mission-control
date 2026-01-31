import { mutation } from "./_generated/server";

// Seed the starting agent roster
export const seedAgents = mutation({
  handler: async (ctx) => {
    const agents = [
      {
        agentId: "roy",
        name: "Roy",
        emoji: "🦊",
        role: "Squad Lead",
        description:
          "Operations coordinator. Handles direct requests, delegates tasks, monitors progress. The primary human interface.",
        level: "lead" as const,
        sessionKey: "agent:main:main",
        model: "anthropic/claude-opus-4-5",
        heartbeatSchedule: "*/15 * * * *",
        status: "active" as const,
        lastHeartbeat: Date.now(),
        lastActive: Date.now(),
      },
      {
        agentId: "scout",
        name: "Scout",
        emoji: "🔍",
        role: "Research & Intel",
        description:
          "Competitor monitoring, market research, trend tracking. Every claim comes with receipts. Finds opportunities others miss.",
        level: "specialist" as const,
        sessionKey: "agent:scout:main",
        model: "anthropic/claude-sonnet-4-5",
        heartbeatSchedule: "2-59/15 * * * *",
        status: "idle" as const,
        lastHeartbeat: Date.now(),
        lastActive: Date.now(),
      },
      {
        agentId: "arrow",
        name: "Arrow",
        emoji: "📧",
        role: "SDR / Outbound",
        description:
          "Sales development. Finds prospects, writes personalized outreach, manages follow-up sequences. Every email earns its place.",
        level: "specialist" as const,
        sessionKey: "agent:arrow:main",
        model: "anthropic/claude-sonnet-4-5",
        heartbeatSchedule: "4-59/15 * * * *",
        status: "idle" as const,
        lastHeartbeat: Date.now(),
        lastActive: Date.now(),
      },
      {
        agentId: "echo",
        name: "Echo",
        emoji: "📱",
        role: "Social & Brand",
        description:
          "X/Twitter engagement, content creation, build-in-public posts. Thinks in hooks and threads.",
        level: "intern" as const,
        sessionKey: "agent:echo:main",
        model: "anthropic/claude-sonnet-4-5",
        heartbeatSchedule: "6-59/15 * * * *",
        status: "offline" as const,
        lastHeartbeat: Date.now(),
        lastActive: Date.now(),
      },
      {
        agentId: "sift",
        name: "Sift",
        emoji: "📬",
        role: "Email Triage",
        description:
          "Classifies inbound email, routes urgent issues, drafts responses. Keeps the inbox at zero.",
        level: "intern" as const,
        sessionKey: "agent:sift:main",
        model: "anthropic/claude-sonnet-4-5",
        heartbeatSchedule: "8-59/15 * * * *",
        status: "offline" as const,
        lastHeartbeat: Date.now(),
        lastActive: Date.now(),
      },
      {
        agentId: "pulse",
        name: "Pulse",
        emoji: "📊",
        role: "Analytics",
        description:
          "Metrics tracking, daily reports, anomaly detection. Spots trends and flags what matters.",
        level: "intern" as const,
        sessionKey: "agent:pulse:main",
        model: "anthropic/claude-sonnet-4-5",
        heartbeatSchedule: "10-59/15 * * * *",
        status: "offline" as const,
        lastHeartbeat: Date.now(),
        lastActive: Date.now(),
      },
      {
        agentId: "forge",
        name: "Forge",
        emoji: "🔧",
        role: "Engineer",
        description:
          "Code tasks, PR reviews, bug fixes, infrastructure. Clean, tested, documented.",
        level: "specialist" as const,
        sessionKey: "agent:forge:main",
        model: "anthropic/claude-sonnet-4-5",
        heartbeatSchedule: "12-59/15 * * * *",
        status: "offline" as const,
        lastHeartbeat: Date.now(),
        lastActive: Date.now(),
      },
    ];

    const ids = [];
    for (const agent of agents) {
      const id = await ctx.db.insert("agents", agent);
      ids.push({ agentId: agent.agentId, _id: id });
    }

    // Log system activity
    await ctx.db.insert("activity", {
      type: "system",
      agentId: "system",
      agentName: "System",
      agentEmoji: "⚙️",
      message: `Mission Control initialized with ${agents.length} agents: ${agents.map((a) => `${a.emoji} ${a.name}`).join(", ")}`,
    });

    return ids;
  },
});
