#!/usr/bin/env node

/**
 * Mission Control CLI — Used by agents to interact with Convex
 * 
 * Usage:
 *   node mc-cli.js notifications <agentId>           — Check unread notifications
 *   node mc-cli.js tasks [--status <status>]          — List tasks
 *   node mc-cli.js task <taskId>                      — Get task details + comments
 *   node mc-cli.js comment <taskId> <agentId> <name> <emoji> <message>  — Post a comment
 *   node mc-cli.js status <agentId> <status>          — Update agent status
 *   node mc-cli.js heartbeat <agentId>                — Record heartbeat
 *   node mc-cli.js activity [--limit N]               — Recent activity
 *   node mc-cli.js create-task <title> <priority> <createdBy> [--assign <ids>] [--desc <desc>]
 *   node mc-cli.js move-task <taskId> <status> <movedBy>
 *   node mc-cli.js mark-read <agentId>                — Mark all notifications read
 */

const CONVEX_URL = "https://enchanted-spaniel-545.convex.cloud";

async function convexCall(functionPath, args = {}) {
  // Determine if this is a mutation based on function name
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

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${functionPath}: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.value;
}

async function main() {
  const [,, command, ...rest] = process.argv;

  switch (command) {
    case "notifications": {
      const [agentId] = rest;
      if (!agentId) { console.error("Usage: notifications <agentId>"); process.exit(1); }
      const notifs = await convexCall("notifications:getUnread", { agentId });
      if (notifs.length === 0) {
        console.log("No unread notifications.");
      } else {
        console.log(`${notifs.length} unread notification(s):\n`);
        for (const n of notifs) {
          const time = new Date(n._creationTime).toISOString();
          console.log(`  [${n.type}] ${n.message} (${time})`);
        }
      }
      break;
    }

    case "tasks": {
      const statusIdx = rest.indexOf("--status");
      const status = statusIdx >= 0 ? rest[statusIdx + 1] : undefined;
      const tasks = await convexCall("tasks:list", status ? { status } : {});
      if (tasks.length === 0) {
        console.log("No tasks found.");
      } else {
        console.log(`${tasks.length} task(s):\n`);
        for (const t of tasks) {
          const assignees = t.assignees?.join(", ") || "unassigned";
          console.log(`  [${t.status}] ${t.title} (${t.priority}) → ${assignees} | ID: ${t._id}`);
        }
      }
      break;
    }

    case "task": {
      const [taskId] = rest;
      if (!taskId) { console.error("Usage: task <taskId>"); process.exit(1); }
      const task = await convexCall("tasks:get", { taskId });
      if (!task) { console.error("Task not found"); process.exit(1); }
      console.log(`Title: ${task.title}`);
      console.log(`Status: ${task.status} | Priority: ${task.priority}`);
      console.log(`Assignees: ${task.assignees?.join(", ") || "none"}`);
      if (task.description) console.log(`Description: ${task.description}`);
      
      const comments = await convexCall("comments:listByTask", { taskId });
      if (comments.length > 0) {
        console.log(`\nComments (${comments.length}):`);
        for (const c of comments) {
          const time = new Date(c._creationTime).toISOString();
          console.log(`  ${c.authorEmoji || ""} ${c.authorName} (${time}):`);
          console.log(`    ${c.content}\n`);
        }
      }
      break;
    }

    case "comment": {
      const [taskId, authorId, authorName, authorEmoji, ...msgParts] = rest;
      const content = msgParts.join(" ");
      if (!taskId || !authorId || !content) {
        console.error("Usage: comment <taskId> <agentId> <name> <emoji> <message>");
        process.exit(1);
      }
      await convexCall("comments:add", { taskId, authorId, authorName, authorEmoji, content });
      console.log("Comment posted.");
      break;
    }

    case "status": {
      const [agentId, status] = rest;
      if (!agentId || !status) { console.error("Usage: status <agentId> <status>"); process.exit(1); }
      await convexCall("agents:updateStatus", { agentId, status });
      console.log(`${agentId} status → ${status}`);
      break;
    }

    case "heartbeat": {
      const [agentId] = rest;
      if (!agentId) { console.error("Usage: heartbeat <agentId>"); process.exit(1); }
      await convexCall("agents:heartbeat", { agentId });
      console.log(`Heartbeat recorded for ${agentId}`);
      break;
    }

    case "activity": {
      const limitIdx = rest.indexOf("--limit");
      const limit = limitIdx >= 0 ? parseInt(rest[limitIdx + 1]) : 20;
      const activity = await convexCall("activityFeed:recent", { limit });
      if (activity.length === 0) {
        console.log("No recent activity.");
      } else {
        for (const a of activity) {
          const time = new Date(a._creationTime).toISOString();
          console.log(`  ${a.agentEmoji || "⚙️"} ${a.agentName} [${a.type}] ${a.message} (${time})`);
        }
      }
      break;
    }

    case "create-task": {
      const title = rest[0];
      const priority = rest[1];
      const createdBy = rest[2];
      const assignIdx = rest.indexOf("--assign");
      const descIdx = rest.indexOf("--desc");
      const assignees = assignIdx >= 0 ? rest[assignIdx + 1].split(",") : [];
      const description = descIdx >= 0 ? rest.slice(descIdx + 1).join(" ") : undefined;
      
      if (!title || !priority || !createdBy) {
        console.error("Usage: create-task <title> <priority> <createdBy> [--assign ids] [--desc ...]");
        process.exit(1);
      }
      const taskId = await convexCall("tasks:create", { title, priority, createdBy, assignees, description });
      console.log(`Task created: ${taskId}`);
      break;
    }

    case "move-task": {
      const [taskId, status, movedBy] = rest;
      if (!taskId || !status || !movedBy) {
        console.error("Usage: move-task <taskId> <status> <movedBy>");
        process.exit(1);
      }
      await convexCall("tasks:move", { taskId, status, movedBy });
      console.log(`Task moved to ${status}`);
      break;
    }

    case "mark-read": {
      const [agentId] = rest;
      if (!agentId) { console.error("Usage: mark-read <agentId>"); process.exit(1); }
      const count = await convexCall("notifications:markAllRead", { agentId });
      console.log(`Marked ${count} notification(s) as read for ${agentId}`);
      break;
    }

    default:
      console.error("Commands: notifications, tasks, task, comment, status, heartbeat, activity, create-task, move-task, mark-read");
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
