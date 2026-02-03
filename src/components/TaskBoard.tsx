"use client";

import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { priorityColor, KANBAN_COLUMNS, AGENT_EMOJIS } from "@/lib/utils";
import TaskDetailModal from "./TaskDetailModal";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

type Task = {
  _id: Id<"tasks">;
  title: string;
  status: string;
  priority: "low" | "medium" | "high" | "urgent";
  assignees: string[];
  labels?: string[];
};

// Draggable task card component
function SortableTaskCard({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="task-card bg-bg-card border border-border-primary/60 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-accent-warm-dim/40"
    >
      {/* Priority + Title */}
      <div className="flex items-start gap-2 mb-2">
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-medium border flex-shrink-0 mt-0.5 ${priorityColor(task.priority)}`}
        >
          {task.priority === "urgent"
            ? "!"
            : task.priority === "high"
              ? "↑"
              : task.priority === "medium"
                ? "—"
                : "↓"}
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
            <span key={id} className="text-sm" title={id}>
              {AGENT_EMOJIS[id] ?? "👤"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Task card overlay (shown while dragging)
function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div className="task-card bg-bg-card border border-accent-warm/60 rounded-lg p-3 shadow-lg rotate-2 w-60">
      <div className="flex items-start gap-2 mb-2">
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-medium border flex-shrink-0 mt-0.5 ${priorityColor(task.priority)}`}
        >
          {task.priority === "urgent"
            ? "!"
            : task.priority === "high"
              ? "↑"
              : task.priority === "medium"
                ? "—"
                : "↓"}
        </span>
        <h3 className="text-sm text-text-primary leading-snug line-clamp-2">
          {task.title}
        </h3>
      </div>
      {task.assignees.length > 0 && (
        <div className="flex items-center gap-0.5">
          {task.assignees.map((id) => (
            <span key={id} className="text-sm" title={id}>
              {AGENT_EMOJIS[id] ?? "👤"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Droppable column
function DroppableColumn({
  col,
  tasks,
  onTaskClick,
}: {
  col: (typeof KANBAN_COLUMNS)[number];
  tasks: Task[];
  onTaskClick: (id: Id<"tasks">) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: col.id,
  });

  return (
    <div
      className={`kanban-column w-64 flex-shrink-0 flex flex-col bg-bg-primary/30 rounded-xl border transition-colors ${
        isOver
          ? "border-accent-warm/60 bg-accent-warm/5"
          : "border-border-primary/50"
      }`}
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
          {tasks.length}
        </span>
      </div>

      {/* Task cards */}
      <SortableContext
        items={tasks.map((t) => t._id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px] transition-colors ${
            isOver ? "bg-accent-warm/5" : ""
          }`}
          data-column={col.id}
        >
          {tasks.length === 0 ? (
            <div
              className={`flex items-center justify-center h-20 text-text-muted/40 text-xs border-2 border-dashed rounded-lg transition-colors ${
                isOver
                  ? "border-accent-warm/40 text-accent-warm/60"
                  : "border-border-primary/30"
              }`}
            >
              {isOver ? "Release to drop" : "Drop here"}
            </div>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard
                key={task._id}
                task={task}
                onClick={() => onTaskClick(task._id)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function TaskBoard() {
  const tasks = useQuery(api.tasks.list, {});
  const moveTask = useMutation(api.tasks.move);
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(
    null
  );
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Group tasks by status
  const tasksByStatus: Record<string, Task[]> = {};
  for (const col of KANBAN_COLUMNS) {
    tasksByStatus[col.id] = (tasks?.filter((t) => t.status === col.id) ??
      []) as Task[];
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks?.find((t) => t._id === event.active.id);
    if (task) setActiveTask(task as Task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTaskId = active.id as Id<"tasks">;
    const activeTaskData = tasks?.find((t) => t._id === activeTaskId);
    if (!activeTaskData) return;

    // Find which column we dropped into
    let targetColumn: string | null = null;

    // Check if over.id is a column ID directly (from useDroppable)
    const matchedCol = KANBAN_COLUMNS.find((c) => c.id === over.id);
    if (matchedCol) {
      targetColumn = matchedCol.id;
    } else {
      // Check if we dropped on another task - use that task's column
      const overTask = tasks?.find((t) => t._id === over.id);
      if (overTask) {
        targetColumn = overTask.status;
      }
    }

    if (!targetColumn || targetColumn === activeTaskData.status) return;

    // Validate it's a valid status
    const validStatuses = [
      "backlog",
      "refining",
      "todo",
      "in_progress",
      "review",
      "done",
      "blocked",
    ];
    if (!validStatuses.includes(targetColumn)) return;

    // Move the task
    moveTask({
      taskId: activeTaskId,
      status: targetColumn as
        | "backlog"
        | "refining"
        | "todo"
        | "in_progress"
        | "review"
        | "done"
        | "blocked",
      movedBy: "human",
    });
  };

  // Custom collision detection that accounts for columns
  const customCollisionDetection = (args: Parameters<typeof closestCorners>[0]) => {
    const collisions = closestCorners(args);
    
    // If no collisions with tasks, check if we're over a column
    if (collisions.length === 0 || !collisions[0]) {
      const { droppableContainers, pointerCoordinates } = args;
      if (!pointerCoordinates) return collisions;

      // Find which column we're hovering over based on position
      for (const container of droppableContainers) {
        const rect = container.rect.current;
        if (rect && pointerCoordinates.x >= rect.left &&
            pointerCoordinates.x <= rect.right &&
            pointerCoordinates.y >= rect.top &&
            pointerCoordinates.y <= rect.bottom) {
          return [{ id: container.id }];
        }
      }
    }
    
    return collisions;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
            {!tasks ? (
              // Loading skeleton
              KANBAN_COLUMNS.map((col) => (
                <div
                  key={col.id}
                  className="kanban-column w-64 flex-shrink-0 flex flex-col bg-bg-primary/30 rounded-xl border border-border-primary/50"
                >
                  <div className="px-3 py-2.5 flex items-center justify-between border-b border-border-primary/30">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{col.icon}</span>
                      <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        {col.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 p-2 space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-20 bg-bg-tertiary/30 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              KANBAN_COLUMNS.map((col) => (
                <DroppableColumn
                  key={col.id}
                  col={col}
                  tasks={tasksByStatus[col.id] ?? []}
                  onTaskClick={setSelectedTaskId}
                />
              ))
            )}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
        </DragOverlay>

        {/* Task Detail Modal */}
        {selectedTaskId && (
          <TaskDetailModal
            taskId={selectedTaskId}
            onClose={() => setSelectedTaskId(null)}
          />
        )}
      </div>
    </DndContext>
  );
}
