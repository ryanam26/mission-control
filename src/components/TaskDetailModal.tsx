"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  relativeTime,
  priorityColor,
  activityTypeColor,
  activityTypeIcon,
  AGENT_EMOJIS,
  highlightMentions,
} from "@/lib/utils";

interface TaskDetailModalProps {
  taskId: Id<"tasks">;
  onClose: () => void;
}

export default function TaskDetailModal({ taskId, onClose }: TaskDetailModalProps) {
  const task = useQuery(api.tasks.get, { taskId });
  const comments = useQuery(api.comments.listByTask, { taskId });
  const taskActivity = useQuery(api.activityFeed.byTask, { taskId, limit: 30 });

  if (!task) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop bg-black/60" onClick={onClose}>
        <div className="bg-bg-secondary rounded-xl p-8 animate-pulse">
          <div className="h-6 w-48 bg-bg-tertiary rounded" />
        </div>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    inbox: "📥 Inbox",
    assigned: "📌 Assigned",
    in_progress: "🔨 In Progress",
    review: "👀 Review",
    done: "✅ Done",
    blocked: "🚫 Blocked",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-bg-secondary border border-border-primary rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border-primary flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-editorial text-xl text-text-primary leading-tight">
              {task.title}
            </h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${priorityColor(task.priority)}`}>
                {task.priority.toUpperCase()}
              </span>
              <span className="text-xs text-text-muted">
                {statusLabels[task.status] ?? task.status}
              </span>
              {task.labels?.map((label) => (
                <span
                  key={label}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-secondary border border-border-primary"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors text-xl leading-none p-1"
          >
            ✕
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-6">
            {/* Description */}
            {task.description && (
              <div>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Description
                </h3>
                <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap bg-bg-primary/50 rounded-lg p-3 border border-border-primary">
                  {task.description}
                </div>
              </div>
            )}

            {/* Assignees */}
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Assignees
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {task.assignees.length === 0 ? (
                  <span className="text-sm text-text-muted italic">Unassigned</span>
                ) : (
                  task.assignees.map((id) => (
                    <span
                      key={id}
                      className="flex items-center gap-1 text-sm bg-bg-tertiary text-text-secondary rounded-full px-2.5 py-1 border border-border-primary"
                    >
                      <span>{AGENT_EMOJIS[id] ?? "👤"}</span>
                      <span className="capitalize">{id}</span>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span>Created by: <strong className="text-text-secondary capitalize">{task.createdBy}</strong></span>
              <span>Created: {relativeTime(task._creationTime)}</span>
              {task.completedAt && <span>Completed: {relativeTime(task.completedAt)}</span>}
              {task.blockedReason && (
                <span className="text-accent-red">Blocked: {task.blockedReason}</span>
              )}
            </div>

            {/* Comments */}
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Comments ({comments?.length ?? 0})
              </h3>
              <div className="space-y-3">
                {!comments ? (
                  <div className="h-16 bg-bg-tertiary/50 rounded animate-pulse" />
                ) : comments.length === 0 ? (
                  <p className="text-sm text-text-muted italic">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="bg-bg-primary/50 rounded-lg p-3 border border-border-primary"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm">{comment.authorEmoji ?? "👤"}</span>
                        <span className="text-xs font-medium text-text-primary">
                          {comment.authorName}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {relativeTime(comment._creationTime)}
                        </span>
                      </div>
                      <p
                        className="text-sm text-text-secondary leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: highlightMentions(comment.content),
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Task Activity History */}
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                History
              </h3>
              <div className="space-y-1">
                {!taskActivity ? (
                  <div className="h-12 bg-bg-tertiary/50 rounded animate-pulse" />
                ) : taskActivity.length === 0 ? (
                  <p className="text-sm text-text-muted italic">No history</p>
                ) : (
                  taskActivity.map((act) => (
                    <div
                      key={act._id}
                      className="flex items-start gap-2 py-1.5"
                    >
                      <span className="text-xs opacity-60 mt-0.5">
                        {activityTypeIcon(act.type)}
                      </span>
                      <p className={`text-xs leading-relaxed ${activityTypeColor(act.type)}`}>
                        {act.message}
                      </p>
                      <span className="text-[10px] text-text-muted ml-auto flex-shrink-0">
                        {relativeTime(act._creationTime)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
