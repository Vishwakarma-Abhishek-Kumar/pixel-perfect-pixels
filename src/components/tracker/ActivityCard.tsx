import { useState } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { GripHorizontal, Trash2, Sparkles } from "lucide-react";
import type { Activity, Task } from "@/lib/tracker";
import { TaskItem } from "./TaskItem";
import { AddTaskInput } from "./AddTaskInput";

export type CardActions = {
  onAddTask: (title: string) => void;
  onUpdateTask: (tid: string, patch: Partial<Task>) => void;
  onRemoveTask: (tid: string) => void;
  onReorderTasks: (tasks: Task[]) => void;
  onDelete: () => void;
};

type Props = CardActions & {
  activity: Activity;
  dragHandle?: React.HTMLAttributes<HTMLButtonElement>;
  overlay?: boolean;
};

export function ActivityCard({ activity, dragHandle, overlay, ...a }: Props) {
  const done = activity.tasks.filter((t) => t.completed).length;
  const total = activity.tasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const complete = total > 0 && done === total;
  const [confirm, setConfirm] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = activity.tasks.findIndex((t) => t.id === e.active.id);
    const to = activity.tasks.findIndex((t) => t.id === e.over!.id);
    a.onReorderTasks(arrayMove(activity.tasks, from, to));
  };

  return (
    <div
      className={`theme-${activity.theme} group/card relative overflow-hidden rounded-[1.75rem] border border-border/60 card-surface p-5 transition-shadow duration-500 sm:p-6 ${
        overlay
          ? "rotate-2 shadow-lift"
          : complete
            ? "shadow-glow"
            : "shadow-soft hover:shadow-lift"
      }`}
    >
      {/* organic decoration */}
      <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-[45%_55%_60%_40%] bg-theme opacity-[0.09] transition-transform duration-700 group-hover/card:rotate-12 group-hover/card:scale-110" />

      <div className="relative flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-card text-2xl shadow-soft">
          {activity.icon}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="font-display text-xl font-semibold leading-tight tracking-tight">
            {activity.title}
          </h3>
          {activity.description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{activity.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center">
          {confirm ? (
            <div className="flex items-center gap-1 rounded-full bg-card px-1 py-0.5 shadow-soft">
              <button
                onClick={a.onDelete}
                className="rounded-full px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-muted"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirm(false)}
                className="rounded-full px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
              >
                Keep
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setConfirm(true)}
                aria-label="Delete activity"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground opacity-100 transition hover:bg-card hover:text-destructive md:opacity-0 md:group-hover/card:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                {...dragHandle}
                aria-label="Move activity"
                className="flex h-9 w-9 cursor-grab touch-none items-center justify-center rounded-xl text-muted-foreground transition hover:bg-card hover:text-foreground active:cursor-grabbing"
              >
                <GripHorizontal className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="relative mt-5">
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="font-medium text-muted-foreground">
            <span className="text-foreground">{done}</span> / {total} completed
          </span>
          <span className="flex items-center gap-1 font-semibold text-theme">
            {complete && <Sparkles className="h-3.5 w-3.5" />}
            {pct}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-card">
          <motion.div
            className="h-full rounded-full bg-theme"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={activity.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="relative mt-4 -ml-1.5 space-y-0.5">
            {activity.tasks.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                onToggle={() => a.onUpdateTask(t.id, { completed: !t.completed })}
                onRename={(title) => a.onUpdateTask(t.id, { title })}
                onDelete={() => a.onRemoveTask(t.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <div className="relative">
        <AddTaskInput onAdd={a.onAddTask} />
      </div>

      {complete && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mt-3 text-center font-display text-sm italic text-theme"
        >
          All done here — beautifully.
        </motion.p>
      )}
    </div>
  );
}
