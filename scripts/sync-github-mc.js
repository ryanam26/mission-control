#!/usr/bin/env node

/**
 * Sync GitHub Issues ↔ Mission Control
 * 
 * Maps GitHub labels to MC statuses:
 *   needs-review → assigned
 *   approved     → assigned (ready for pickup)
 *   in-progress  → in_progress
 *   blocked      → blocked
 *   (closed)     → done
 * 
 * Usage:
 *   node sync-github-mc.js sync         — Pull GitHub state → update MC
 *   node sync-github-mc.js link <taskId> <issueNumber>  — Link MC task to GH issue
 *   node sync-github-mc.js status       — Show linked tasks
 */

const { execSync } = require("child_process");
const fs = require("fs");

const CONVEX_URL = "https://enchanted-spaniel-545.convex.cloud";
const REPO = "ryanam26/geniusforms";
const LINK_FILE = "/home/ubuntu/mission-control/scripts/gh-mc-links.json";

// Load or create link file
function loadLinks() {
  try {
    return JSON.parse(fs.readFileSync(LINK_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveLinks(links) {
  fs.writeFileSync(LINK_FILE, JSON.stringify(links, null, 2));
}

function ghLabelToMcStatus(labels) {
  if (labels.includes("in-progress")) return "in_progress";
  if (labels.includes("blocked")) return "blocked";
  if (labels.includes("approved")) return "assigned"; // approved = ready for agent
  if (labels.includes("needs-review")) return "assigned";
  return null;
}

async function convexCall(functionPath, args = {}) {
  const mutations = ["add", "upsert", "create", "update", "move", "markRead", "markAllRead",
    "markDelivered", "heartbeat", "updateStatus", "subscribe", "logSystem"];
  const fnName = functionPath.split(":")[1];
  const isMutation = mutations.some(m => fnName?.toLowerCase().includes(m.toLowerCase()));
  const endpoint = isMutation ? "mutation" : "query";

  const res = await fetch(`${CONVEX_URL}/api/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: functionPath, args, format: "json" }),
  });

  if (!res.ok) throw new Error(`${functionPath}: ${res.status} ${await res.text()}`);
  return (await res.json()).value;
}

async function getGitHubIssue(number) {
  const output = execSync(
    `gh issue view ${number} --repo ${REPO} --json number,title,state,labels,assignees`,
    { encoding: "utf8" }
  );
  return JSON.parse(output);
}

async function syncAll() {
  const links = loadLinks();
  
  for (const [taskId, issueNumber] of Object.entries(links)) {
    try {
      const issue = await getGitHubIssue(issueNumber);
      const labels = issue.labels.map(l => l.name);
      
      let newStatus;
      if (issue.state === "CLOSED") {
        newStatus = "done";
      } else {
        newStatus = ghLabelToMcStatus(labels);
      }
      
      if (newStatus) {
        await convexCall("tasks:moveTask", { taskId, status: newStatus, movedBy: "sync" });
        console.log(`✓ #${issueNumber} → ${taskId}: ${newStatus}`);
      } else {
        console.log(`- #${issueNumber}: no status change (labels: ${labels.join(", ")})`);
      }
    } catch (err) {
      console.error(`✗ #${issueNumber}: ${err.message}`);
    }
  }
}

async function linkTask(taskId, issueNumber) {
  const links = loadLinks();
  links[taskId] = parseInt(issueNumber);
  saveLinks(links);
  console.log(`Linked: MC task ${taskId} ↔ GitHub #${issueNumber}`);
}

async function showStatus() {
  const links = loadLinks();
  if (Object.keys(links).length === 0) {
    console.log("No linked tasks. Use: sync-github-mc.js link <taskId> <issueNumber>");
    return;
  }
  for (const [taskId, issueNumber] of Object.entries(links)) {
    try {
      const issue = await getGitHubIssue(issueNumber);
      const labels = issue.labels.map(l => l.name).join(", ");
      console.log(`${taskId} ↔ #${issueNumber} "${issue.title}" [${issue.state}] (${labels})`);
    } catch (err) {
      console.log(`${taskId} ↔ #${issueNumber} (error: ${err.message})`);
    }
  }
}

async function main() {
  const [,, command, ...rest] = process.argv;
  switch (command) {
    case "sync": await syncAll(); break;
    case "link": await linkTask(rest[0], rest[1]); break;
    case "status": await showStatus(); break;
    default:
      console.log("Usage: sync-github-mc.js [sync|link|status]");
  }
}

main().catch(console.error);
