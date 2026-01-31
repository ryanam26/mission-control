"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { relativeTime, statusColor, statusPulse, levelBadge } from "@/lib/utils";

export default function AgentSidebar() {
  const agents = useQuery(api.agents.list);

  // Sort: lead first, then specialist, then intern; within same level, active first
  const sortedAgents = agents?.slice().sort((a, b) => {
    const levelOrder = { lead: 0, specialist: 1, intern: 2 };
    const statusOrder = { active: 0, working: 1, idle: 2, error: 3, offline: 4 };
    const levelDiff = (levelOrder[a.level] ?? 3) - (levelOrder[b.level] ?? 3);
    if (levelDiff !== 0) return levelDiff;
    return (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
  });

  return (
    <aside className="w-72 min-w-72 bg-bg-secondary border-r border-border-primary flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border-primary">
        <h2 className="font-editorial text-lg text-text-primary tracking-wide">
          The Squad
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          {agents?.filter(a => a.status === "active" || a.status === "working").length ?? 0} active
          {" · "}
          {agents?.length ?? 0} total
        </p>
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {!sortedAgents ? (
          // Loading skeleton
          Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="p-3 rounded-lg bg-bg-tertiary/50 animate-pulse h-20" />
          ))
        ) : (
          sortedAgents.map((agent) => {
            const badge = levelBadge(agent.level);
            return (
              <div
                key={agent._id}
                className="p-3 rounded-lg bg-bg-card hover:bg-bg-card-hover border border-border-primary/50 hover:border-border-secondary transition-all cursor-default group"
              >
                {/* Top row: emoji + name + status dot */}
                <div className="flex items-center gap-2">
                  <span className="text-xl">{agent.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-text-primary truncate">
                        {agent.name}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor(agent.status)} ${statusPulse(agent.status)}`}
                        title={agent.status}
                      />
                    </div>
                    <p className="text-xs text-text-muted truncate">{agent.role}</p>
                  </div>
                </div>

                {/* Bottom row: level badge + heartbeat */}
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge.className}`}>
                    {badge.label}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {agent.lastHeartbeat ? `♡ ${relativeTime(agent.lastHeartbeat)}` : "no heartbeat"}
                  </span>
                </div>

                {/* Current task (if any) */}
                {agent.currentTask && (
                  <div className="mt-2 text-[11px] text-accent-warm-dim bg-accent-warm/5 rounded px-2 py-1 truncate border border-accent-warm/10">
                    ▸ {agent.currentTask}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
