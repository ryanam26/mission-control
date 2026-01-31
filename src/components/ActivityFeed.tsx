"use client";

import { useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";
import { relativeTime, activityTypeColor, activityTypeIcon } from "@/lib/utils";

export default function ActivityFeed() {
  const activities = useQuery(api.activityFeed.recent, { limit: 100 });
  const feedRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Auto-scroll to bottom when new items arrive
  useEffect(() => {
    if (activities && activities.length > prevCountRef.current) {
      if (feedRef.current) {
        feedRef.current.scrollTop = 0; // desc order, newest at top
      }
    }
    prevCountRef.current = activities?.length ?? 0;
  }, [activities]);

  return (
    <aside className="w-80 min-w-80 bg-bg-secondary border-l border-border-primary flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border-primary">
        <h2 className="font-editorial text-lg text-text-primary tracking-wide">
          Activity
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          Real-time feed · {activities?.length ?? 0} events
        </p>
      </div>

      {/* Feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto activity-feed">
        {!activities ? (
          // Loading skeleton
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 bg-bg-tertiary/50 rounded animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm">
            <p className="text-2xl mb-2">📡</p>
            <p>No activity yet</p>
            <p className="text-xs mt-1">Events will appear here in real-time</p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {activities.map((activity) => (
              <div
                key={activity._id}
                className="px-3 py-2.5 rounded-lg hover:bg-bg-tertiary/50 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  {/* Agent emoji + type icon */}
                  <span className="text-base flex-shrink-0 mt-0.5">
                    {activity.agentEmoji || activityTypeIcon(activity.type)}
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* Agent name + time */}
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-medium text-text-primary">
                        {activity.agentName}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {relativeTime(activity._creationTime)}
                      </span>
                    </div>

                    {/* Activity message */}
                    <p className={`text-xs leading-relaxed ${activityTypeColor(activity.type)}`}>
                      <span className="mr-1 opacity-60">
                        {activityTypeIcon(activity.type)}
                      </span>
                      {activity.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
