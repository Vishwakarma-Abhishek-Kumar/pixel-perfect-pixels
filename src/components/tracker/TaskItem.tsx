import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Pencil, X } from "lucide-react";
import type { Task } from "@/lib/tracker";

type Props = {
  task: Task;
  onToggle: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
};

export function TaskItem({ task, onToggle, onRename, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const [burst, setBurst] = useState(0);

  const commit = () => {
    const v = draft.trim();
    if (v) onRename(v);
    else setDraft(task.title);
    setEditing(false);
  };

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group/task relative flex min-h-11 items-center gap-1.5 rounded-xl pr-1 transition-colors hover:bg-tint ${isDragging ? "z-10 bg-card shadow-lift" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Reorder task"
        className="flex h-9 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground/40 opacity-100 transition-opacity active:cursor-grabbing md:opacity-0 md:group-hover/task:opacity-100"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <button
        onClick={() => {
          if (!task.completed) setBurst((b) => b + 1);
          onToggle();
        }}
        aria label={task.completed ? "Mark incomplete" : "Mark complete"}
        className="relative flex h-6 w-6 shrink-0 items-center justify-center"
      >
        <motion.span
          animate={{ scale: task.completed ? [1, 0.8, 1.12, 1] : 1 }}
          transition={{ duration: 0.35 }}
          className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-colors ${
            task.completed ? "border-theme bg-theme" : "border-border bg-card group-hover/task:border-theme"
          }`}
        >
          <AnimatePresence>
            {task.completed && (
              <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                <Check className="h-3.5 w-3.5 text-card" strokeWidth={3.5} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.span>
        <AnimatePresence>
          {burst > 0 && task.completed && (
            <motion.span key={burst} className="pointer-events-none absolute inset-0">
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <motion.span
                  key={deg}
                  className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-theme"
                  initial={{ x: "-50%", y: "-50%", opacity: 1, scale: 1 }}
                  animate={{
                    x: `calc(-50% + ${Math.cos((deg * Math.PI) / 180) * 18}px)`,
                    y: `calc(-50% + ${Math.sin((deg * Math.PI) / 180) * 18}px)`,
                    opacity: 0,
                    scale: 0.4,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              ))}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setDraft(task.title); setEditing(false); }
          }}
          className="min-w-0 flex-1 rounded-md bg-card px-2 py-1 text-[15px] outline-none ring-1 ring-border focus:ring-theme"
        />
      ) : (
        <span
          onDoubleClick={() => { setDraft(task.title); setEditing(true); }}
          className={`relative min-w-0 flex-1 px-1 py-2 text-[15px] leading-snug transition-all duration-300 ${
            task.completed ? "text-muted-foreground opacity-60" : "text-card-foreground"
          }`}
        >
          {task.title}
          <motion.span
            initial={false}
            animate={{ scaleX: task.completed ? 1 : 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ originX: 0 }}
            className="pointer-events-none absolute left-1 right-1 top-1/2 h-px bg-muted-foreground"
          />
        </span>
      )}

      {!editing && (
        <div className="flex shrink-0 opacity-100 transition-opacity md:opacity-0 md:group-hover/task:opacity-100">
          <button onClick={() => { setDraft(task.title); setEditing(true); }} aria-label="Edit task" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-card hover:text-foreground">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} aria-label="Delete task" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-card hover:text-destructive">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </li>
  );
}
