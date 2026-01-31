"use client";

import AgentSidebar from "@/components/AgentSidebar";
import TaskBoard from "@/components/TaskBoard";
import ActivityFeed from "@/components/ActivityFeed";

export default function Home() {
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-bg-primary">
      {/* Left Sidebar — Agents */}
      <AgentSidebar />

      {/* Center — Task Board */}
      <TaskBoard />

      {/* Right Sidebar — Activity Feed */}
      <ActivityFeed />
    </div>
  );
}
