/**
 * Format a timestamp into a relative time string (e.g., "2m ago", "3h ago")
 */
export function relativeTime(timestamp: number | undefined): string {
  if (!timestamp) return "never";
  
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 0) return "just now";
  
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  return `${Math.floor(days / 7)}w ago`;
}

/**
 * Priority color mapping
 */
export function priorityColor(priority: string): string {
  switch (priority) {
    case "urgent": return "bg-accent-red/20 text-accent-red border-accent-red/30";
    case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "medium": return "bg-accent-yellow/20 text-accent-yellow border-accent-yellow/30";
    case "low": return "bg-accent-green/20 text-accent-green border-accent-green/30";
    default: return "bg-bg-tertiary text-text-secondary border-border-primary";
  }
}

/**
 * Status color for agents
 */
export function statusColor(status: string): string {
  switch (status) {
    case "active": return "bg-accent-green";
    case "working": return "bg-accent-yellow";
    case "idle": return "bg-text-muted";
    case "error": return "bg-accent-red";
    case "offline": return "bg-text-muted opacity-50";
    default: return "bg-text-muted";
  }
}

/**
 * Status pulse class
 */
export function statusPulse(status: string): string {
  if (status === "active" || status === "working") return "status-pulse";
  return "";
}

/**
 * Activity type color
 */
export function activityTypeColor(type: string): string {
  switch (type) {
    case "task_created": return "text-accent-blue";
    case "comment_added": return "text-accent-green";
    case "task_moved": return "text-accent-yellow";
    case "task_updated": return "text-accent-warm";
    case "agent_status_change": return "text-accent-purple";
    case "agent_heartbeat": return "text-text-muted";
    case "assignment_changed": return "text-accent-warm";
    case "document_created": return "text-accent-blue";
    case "mention": return "text-accent-red";
    case "system": return "text-text-muted";
    default: return "text-text-secondary";
  }
}

/**
 * Activity type icon
 */
export function activityTypeIcon(type: string): string {
  switch (type) {
    case "task_created": return "📋";
    case "comment_added": return "💬";
    case "task_moved": return "➡️";
    case "task_updated": return "✏️";
    case "agent_status_change": return "🔄";
    case "agent_heartbeat": return "💓";
    case "assignment_changed": return "👤";
    case "document_created": return "📄";
    case "mention": return "📢";
    case "system": return "⚙️";
    default: return "•";
  }
}

/**
 * Level badge styling
 */
export function levelBadge(level: string): { label: string; className: string } {
  switch (level) {
    case "lead":
      return { label: "Lead", className: "bg-accent-warm/20 text-accent-warm border border-accent-warm/30" };
    case "specialist":
      return { label: "Specialist", className: "bg-accent-blue/20 text-accent-blue border border-accent-blue/30" };
    case "intern":
      return { label: "Intern", className: "bg-accent-purple/20 text-accent-purple border border-accent-purple/30" };
    default:
      return { label: level, className: "bg-bg-tertiary text-text-muted border border-border-primary" };
  }
}

/**
 * Kanban column config
 */
export const KANBAN_COLUMNS = [
  { id: "inbox", label: "Inbox", icon: "📥" },
  { id: "assigned", label: "Assigned", icon: "📌" },
  { id: "in_progress", label: "In Progress", icon: "🔨" },
  { id: "review", label: "Review", icon: "👀" },
  { id: "done", label: "Done", icon: "✅" },
  { id: "blocked", label: "Blocked", icon: "🚫" },
] as const;

/**
 * Highlight @mentions in text
 */
export function highlightMentions(text: string): string {
  return text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
}

/**
 * Agent emoji lookup (for assignee display)
 */
export const AGENT_EMOJIS: Record<string, string> = {
  roy: "🦊",
  scout: "🔍",
  arrow: "📧",
  echo: "📱",
  sift: "📬",
  pulse: "📊",
  forge: "🔧",
  human: "👤",
};
