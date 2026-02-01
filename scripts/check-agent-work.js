#!/usr/bin/env node

/**
 * QA Review Checker — finds new agent comments that need Roy's review
 * 
 * Run by Roy's cron. Outputs JSON of new agent comments for review.
 * Tracks state in qa-review-state.json to avoid re-reviewing.
 */

const fs = require("fs");
const path = require("path");

const CONVEX_URL = "https://enchanted-spaniel-545.convex.cloud";
const STATE_FILE = path.join(__dirname, "qa-review-state.json");

// Agents whose work needs QA (not "human", not "system")
const AGENT_AUTHORS = ["scout", "arrow", "echo", "sift", "pulse", "forge"];

async function convexQuery(functionPath, args = {}) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: functionPath, args, format: "json" }),
  });
  if (!res.ok) throw new Error(`Query failed: ${res.status}`);
  const data = await res.json();
  return data.value;
}

async function main() {
  // Load state
  let state = { lastCheckedAt: 0, reviewedComments: [] };
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
  } catch {}

  // Get recent activity (comments from agents)
  const activity = await convexQuery("activityFeed:recent", { limit: 50 });

  // Filter for new agent comments we haven't reviewed
  const newAgentWork = activity.filter((a) => {
    if (a.type !== "comment_added") return false;
    if (!AGENT_AUTHORS.includes(a.agentId)) return false;
    if (a._creationTime <= state.lastCheckedAt) return false;
    if (state.reviewedComments.includes(a._id)) return false;
    // Skip short comments (likely just acknowledgments)
    if (a.message && a.message.length < 100) return false;
    return true;
  });

  if (newAgentWork.length === 0) {
    console.log("NO_NEW_WORK");
    process.exit(0);
  }

  // Output the work that needs review
  const output = {
    count: newAgentWork.length,
    items: newAgentWork.map((a) => ({
      activityId: a._id,
      agentId: a.agentId,
      agentName: a.agentName,
      taskId: a.taskId,
      commentId: a.commentId,
      message: a.message,
      timestamp: new Date(a._creationTime).toISOString(),
    })),
  };

  console.log(JSON.stringify(output, null, 2));

  // Update state
  state.lastCheckedAt = Math.max(...newAgentWork.map((a) => a._creationTime));
  state.reviewedComments = [
    ...state.reviewedComments.slice(-100), // Keep last 100
    ...newAgentWork.map((a) => a._id),
  ];
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
