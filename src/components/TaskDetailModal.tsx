"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  relativeTime,
  priorityColor,
  activityTypeColor,
  activityTypeIcon,
  AGENT_EMOJIS,
} from "@/lib/utils";

interface TaskDetailModalProps {
  taskId: Id<"tasks">;
  onClose: () => void;
}

export default function TaskDetailModal({ taskId, onClose }: TaskDetailModalProps) {
  const task = useQuery(api.tasks.get, { taskId });
  const comments = useQuery(api.comments.listByTask, { taskId });
  const taskActivity = useQuery(api.activityFeed.byTask, { taskId, limit: 30 });
  const addComment = useMutation(api.comments.add);

  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (comments && comments.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments?.length]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || sending) return;

    setSending(true);
    try {
      await addComment({
        taskId,
        authorId: "human",
        authorName: "Ryan",
        authorEmoji: "👤",
        content: commentText.trim(),
      });
      setCommentText("");
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setSending(false);
    }
  };

  if (!task) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
        <div className="bg-[#1e1b18] rounded-xl p-8 animate-pulse">
          <div className="h-6 w-48 bg-[#2a2520] rounded" />
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#1e1b18] border border-[#3a332b] rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#3a332b] flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-xl text-[#e8e0d4] leading-tight">
              {task.title}
            </h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${priorityColor(task.priority)}`}>
                {task.priority.toUpperCase()}
              </span>
              <span className="text-xs text-[#8a7e6e]">
                {statusLabels[task.status] ?? task.status}
              </span>
              {task.assignees.map((id) => (
                <span
                  key={id}
                  className="flex items-center gap-1 text-xs bg-[#2a2520] text-[#b8a88a] rounded-full px-2 py-0.5 border border-[#3a332b]"
                >
                  <span>{AGENT_EMOJIS[id] ?? "👤"}</span>
                  <span className="capitalize">{id}</span>
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8a7e6e] hover:text-[#e8e0d4] transition-colors text-xl leading-none p-1"
          >
            ✕
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* Description */}
            {task.description && (
              <div>
                <h3 className="text-[10px] font-semibold text-[#8a7e6e] uppercase tracking-wider mb-2">
                  Description
                </h3>
                <div className="text-sm text-[#b8a88a] leading-relaxed bg-[#1a1714]/60 rounded-lg p-3 border border-[#2a2520]">
                  {task.description}
                </div>
              </div>
            )}

            {/* Comments */}
            <div>
              <h3 className="text-[10px] font-semibold text-[#8a7e6e] uppercase tracking-wider mb-3">
                Comments ({comments?.length ?? 0})
              </h3>
              <div className="space-y-3">
                {!comments ? (
                  <div className="h-16 bg-[#2a2520]/50 rounded animate-pulse" />
                ) : comments.length === 0 ? (
                  <p className="text-sm text-[#8a7e6e] italic">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="bg-[#1a1714]/60 rounded-lg p-4 border border-[#2a2520]"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">{comment.authorEmoji ?? "👤"}</span>
                        <span className="text-sm font-semibold text-[#e8e0d4]">
                          {comment.authorName}
                        </span>
                        <span className="text-[10px] text-[#8a7e6e]">
                          {relativeTime(comment._creationTime)}
                        </span>
                      </div>
                      <div className="prose prose-sm prose-invert max-w-none
                        prose-headings:text-[#e8e0d4] prose-headings:font-serif prose-headings:mt-3 prose-headings:mb-1
                        prose-h2:text-base prose-h3:text-sm
                        prose-p:text-[#b8a88a] prose-p:leading-relaxed prose-p:my-1
                        prose-strong:text-[#d4c4a8]
                        prose-a:text-[#c9956b] prose-a:no-underline hover:prose-a:underline
                        prose-li:text-[#b8a88a] prose-li:my-0.5
                        prose-ul:my-1 prose-ol:my-1
                        prose-hr:border-[#3a332b] prose-hr:my-3
                        prose-code:text-[#c9956b] prose-code:bg-[#2a2520] prose-code:px-1 prose-code:rounded
                        prose-blockquote:border-[#c9956b] prose-blockquote:text-[#8a7e6e]
                      ">
                        <ReactMarkdown>{comment.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>
            </div>

            {/* History */}
            <div>
              <h3 className="text-[10px] font-semibold text-[#8a7e6e] uppercase tracking-wider mb-2">
                History
              </h3>
              <div className="space-y-1">
                {!taskActivity ? (
                  <div className="h-12 bg-[#2a2520]/50 rounded animate-pulse" />
                ) : taskActivity.length === 0 ? (
                  <p className="text-sm text-[#8a7e6e] italic">No history</p>
                ) : (
                  taskActivity.map((act) => (
                    <div key={act._id} className="flex items-start gap-2 py-1">
                      <span className="text-xs opacity-60 mt-0.5">
                        {activityTypeIcon(act.type)}
                      </span>
                      <p className={`text-xs leading-relaxed ${activityTypeColor(act.type)}`}>
                        {act.message.length > 120 ? act.message.slice(0, 120) + "..." : act.message}
                      </p>
                      <span className="text-[10px] text-[#8a7e6e] ml-auto flex-shrink-0">
                        {relativeTime(act._creationTime)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comment Input — fixed at bottom */}
        <div className="p-4 border-t border-[#3a332b] bg-[#1e1b18]">
          <form onSubmit={handleSubmitComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment... (use @agent to mention)"
              className="flex-1 bg-[#1a1714] border border-[#3a332b] rounded-lg px-3 py-2 text-sm text-[#e8e0d4] placeholder-[#5a5245] focus:outline-none focus:border-[#c9956b] transition-colors"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || sending}
              className="px-4 py-2 bg-[#c9956b] text-[#1a1714] rounded-lg text-sm font-medium hover:bg-[#d4a87a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? "..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
