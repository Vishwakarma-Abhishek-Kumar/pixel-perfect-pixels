import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  DragOverlay,
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
  arrayMove,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import type { Activity, Task } from "@/lib/tracker";
import { ActivityCard, type CardActions } from "./ActivityCard";

type Props = {
  activities: Activity[];
  onReorder: (list: Activity[]) => void;
  actionsFor: (id: string) => CardActions;
};

function useColumns() {
  const [n, setN] = useState(1);
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      setN(w < 640 ? 1 : w < 1024 ? 2 : w < 1440 ? 3 : 4);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return n;
}

function SortableCard({
  activity,
  actions,
  index,
}: {
  activity: Activity;
  actions: CardActions;
  index: number;
}) {
  const { attributes, listeners, setNodeRef, isDragging, isOver } = useSortable({
    id: activity.id,
  });
  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0.35 : 1, y: 0 }}
      transition={{
        delay: Math.min(index * 0.05, 0.3),
        layout: { type: "spring", stiffness: 300, damping: 30 },
      }}
      className={`rounded-[1.75rem] ${isOver && !isDragging ? "outline-2 outline-dashed outline-offset-4 outline-ring" : ""}`}
    >
      <ActivityCard activity={activity} dragHandle={{ ...attributes, ...listeners }} {...actions} />
    </motion.div>
  );
}

const noop = () => {};
const noopActions: CardActions = {
  onAddTask: noop,
  onUpdateTask: noop as (t: string, p: Partial<Task>) => void,
  onRemoveTask: noop,
  onReorderTasks: noop,
  onDelete: noop,
};

export function ActivityBoard({ activities, onReorder, actionsFor }: Props) {
  const cols = useColumns();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const columns: Activity[][] = Array.from({ length: cols }, () => []);
  activities.forEach((a, i) => columns[i % cols]!.push(a));

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (!e.over || e.active.id === e.over.id) return;
    const from = activities.findIndex((a) => a.id === e.active.id);
    const to = activities.findIndex((a) => a.id === e.over!.id);
    onReorder(arrayMove(activities, from, to));
  };

  const active = activities.find((a) => a.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={activities.map((a) => a.id)} strategy={() => null}>
        <div
          className="grid items-start gap-5 sm:gap-6"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-5 sm:gap-6">
              {col.map((a) => (
                <SortableCard
                  key={a.id}
                  activity={a}
                  actions={actionsFor(a.id)}
                  index={activities.indexOf(a)}
                />
              ))}
            </div>
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={{ duration: 220 }}>
        {active ? <ActivityCard activity={active} overlay {...noopActions} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
