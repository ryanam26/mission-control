"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { priorityColor, KANBAN_COLUMNS, AGENT_EMOJIS } from "@/lib/utils";
import TaskDetailModal from "./TaskDetailModal";

export default function TaskBoard() {
  const tasks = useQuery(api.tasks.list, {});
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(null);

  // Group tasks by status
  const tasksByStatus: Record<string, typeof tasks> = {};
  for (const col of KANBAN_COLUMNS) {
    tasksByStatus[col.id] = tasks?.filter((t) => t.status === col.id) ?? [];
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border-primary bg-bg-secondary/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-editorial text-2xl text-text-primary tracking-wide">
              Mission Control
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              GeniusForms · Agent Operations Board
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span>{tasks?.length ?? 0} tasks</span>
            <span className="w-1 h-1 rounded-full bg-border-secondary" />
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green status-pulse" />
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-4 h-full min-w-max">
          {KANBAN_COLUMNS.map((col) => {
            const columnTasks = tasksByStatus[col.id] ?? [];
            return (
              <div
                key={col.id}
                className="kanban-column w-64 flex-shrink-0 flex flex-col bg-bg-primary/30 rounded-xl border border-border-primary/50"
              >
                {/* Column header */}
                <div className="px-3 py-2.5 flex items-center justify-between border-b border-border-primary/30">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{col.icon}</span>
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      {col.label}
                    </span>
                  </div>
                  <span className="text-[10px] bg-bg-tertiary text-text-muted rounded-full px-1.5 py-0.5 font-mono">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Task cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {!tasks ? (
                    // Loading skeleton
                    Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="h-20 bg-bg-tertiary/30 rounded-lg animate-pulse" />
                    ))
                  ) : columnTasks.length === 0 ? (
                    <div className="flex items-center justify-center h-20 text-text-muted/40 text-xs">
                      No tasks
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <div
                        key={task._id}
                        onClick={() => setSelectedTaskId(task._id)}
                        className="task-card bg-bg-card border border-border-primary/60 rounded-lg p-3 cursor-pointer hover:border-accent-warm-dim/40"
                      >
                        {/* Priority + Title */}
                        <div className="flex items-start gap-2 mb-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border flex-shrink-0 mt-0.5 ${priorityColor(task.priority)}`}>
                            {task.priority === "urgent" ? "!" : task.priority === "high" ? "↑" : task.priority === "medium" ? "—" : "↓"}
                          </span>
                          <h3 className="text-sm text-text-primary leading-snug line-clamp-2">
                            {task.title}
                          </h3>
                        </div>

                        {/* Labels */}
                        {task.labels && task.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {task.labels.map((label) => (
                              <span
                                key={label}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted border border-border-primary/50"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Assignees */}
                        {task.assignees.length > 0 && (
                          <div className="flex items-center gap-0.5">
                            {task.assignees.map((id) => (
                              <span
                                key={id}
                                className="text-sm"
                                title={id}
                              >
                                {AGENT_EMOJIS[id] ?? "👤"}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}
