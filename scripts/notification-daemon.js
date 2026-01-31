#!/usr/bin/env node

/**
 * Notification Daemon for Mission Control
 * 
 * Polls Convex every 5 seconds for undelivered notifications,
 * then delivers them to the target agent's Clawdbot session.
 * 
 * Run with: node scripts/notification-daemon.js
 * Or via pm2: pm2 start scripts/notification-daemon.js --name mc-notifications
 */

const CONVEX_URL = "https://enchanted-spaniel-545.convex.cloud";
const GATEWAY_URL = "http://127.0.0.1:18789";
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || "6e7bb69c02bd971b070736d13f1c53c32cc0179a3f694ecf";
const POLL_INTERVAL_MS = 5000; // 5 seconds (Bhanu uses 2s, we're slightly more conservative)

// Agent IDs that are currently active (Phase 1)
const ACTIVE_AGENTS = ["roy", "scout", "arrow"];

/**
 * Call a Convex query/mutation
 */
async function convexCall(functionPath, args = {}) {
  const isQuery = !functionPath.includes("mark");
  const endpoint = isQuery ? "query" : "mutation";
  
  const res = await fetch(`${CONVEX_URL}/api/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: functionPath,
      args,
      format: "json",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Convex ${functionPath} failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.value;
}

/**
 * Send a message to an agent's session via Clawdbot Gateway
 */
async function sendToAgent(agentId, message) {
  const sessionKey = `agent:${agentId}:main`;
  
  try {
    const res = await fetch(`${GATEWAY_URL}/api/sessions/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GATEWAY_TOKEN}`,
      },
      body: JSON.stringify({
        sessionKey,
        message,
        timeoutSeconds: 30,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[DAEMON] Failed to send to ${agentId}: ${res.status} ${text}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`[DAEMON] Error sending to ${agentId}:`, err.message);
    return false;
  }
}

/**
 * Main poll loop
 */
async function poll() {
  for (const agentId of ACTIVE_AGENTS) {
    try {
      const notifications = await convexCall("notifications:getUndelivered", { agentId });
      
      if (!notifications || notifications.length === 0) continue;

      console.log(`[DAEMON] ${agentId}: ${notifications.length} undelivered notification(s)`);

      for (const notif of notifications) {
        // Format the notification message
        const message = `🔔 [Mission Control] ${notif.type.toUpperCase()}: ${notif.message}`;
        
        // Try to deliver to the agent's session
        const delivered = await sendToAgent(agentId, message);
        
        if (delivered) {
          // Mark as delivered in Convex
          await convexCall("notifications:markDelivered", { 
            notificationId: notif._id 
          });
          console.log(`[DAEMON] ✓ Delivered to ${agentId}: ${notif.message.slice(0, 60)}...`);
        } else {
          console.log(`[DAEMON] ✗ Could not deliver to ${agentId} (session may be inactive)`);
          // Don't mark as delivered — will retry next poll
        }
      }
    } catch (err) {
      console.error(`[DAEMON] Error polling for ${agentId}:`, err.message);
    }
  }
}

/**
 * Start the daemon
 */
async function main() {
  console.log(`[DAEMON] Mission Control Notification Daemon started`);
  console.log(`[DAEMON] Convex: ${CONVEX_URL}`);
  console.log(`[DAEMON] Gateway: ${GATEWAY_URL}`);
  console.log(`[DAEMON] Active agents: ${ACTIVE_AGENTS.join(", ")}`);
  console.log(`[DAEMON] Poll interval: ${POLL_INTERVAL_MS}ms`);
  console.log(`[DAEMON] ---`);

  // Initial poll
  await poll();

  // Continue polling
  setInterval(async () => {
    try {
      await poll();
    } catch (err) {
      console.error(`[DAEMON] Poll error:`, err.message);
    }
  }, POLL_INTERVAL_MS);
}

main().catch((err) => {
  console.error(`[DAEMON] Fatal error:`, err);
  process.exit(1);
});
