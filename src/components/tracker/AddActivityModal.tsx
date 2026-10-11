import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { EMOJIS, THEMES, type Activity, type ThemeKey, uid } from "@/lib/tracker";

type Props = { open: boolean; onClose: () => void; onCreate: (a: Omit<Activity, "id">) => void };

export function AddActivityModal({ open, onClose, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("✨");
  const [theme, setTheme] = useState<ThemeKey>("calm");
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState<string[]>([]);
  const [taskDraft, setTaskDraft] = useState("");

  useEffect(() => {
    if (open) { setTitle(""); setIcon("✨"); setTheme("calm"); setDescription(""); setTasks([]); setTaskDraft(""); }
  }, [open]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);

  const pushTask = () => {
    const v = taskDraft.trim();
    if (v) setTasks((t) => [...t, v]);
    setTaskDraft("");
  };

  const save = () => {
    if (!title.trim()) return;
    const all = taskDraft.trim() ? [...tasks, taskDraft.trim()] : tasks;
    onCreate({
      title: title.trim(), icon, theme,
      description: description.trim() || undefined,
      tasks: all.map((t) => ({ id: uid(), title: t, completed: false })),
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Create activity"
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className={`theme-${theme} relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-card shadow-lift sm:rounded-[2rem]`}
          >
            <div className="card-surface px-6 pb-5 pt-6 transition-colors sm:px-8">
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border sm:hidden" />
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold">Create activity</h2>
                <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-card">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card text-3xl shadow-soft">{icon}</div>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Activity name"
                  className="min-w-0 flex-1 bg-transparent font-display text-2xl outline-none placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div className="space-y-6 px-6 py-6 sm:px-8">
              <Field label="Icon">
                <div className="grid grid-cols-10 gap-1">
                  {EMOJIS.map((e) => (
                    <button key={e} onClick={() => setIcon(e)} className={`flex aspect-square items-center justify-center rounded-xl text-xl transition ${icon === e ? "bg-tint ring-2 ring-[var(--accent-c)]" : "hover:bg-muted"}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Theme">
                <div className="flex flex-wrap gap-2">
                  {THEMES.map((t) => (
                    <button key={t.key} onClick={() => setTheme(t.key)} className={`theme-${t.key} flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${theme === t.key ? "border-theme bg-tint font-semibold" : "border-border hover:bg-muted"}`}>
                      <span className="h-3 w-3 rounded-full bg-theme" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Description (optional)">
                <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A gentle note to yourself" className="w-full rounded-xl bg-muted px-4 py-3 text-[15px] outline-none ring-1 ring-transparent focus:ring-theme" />
              </Field>

              <Field label="Tasks">
                <ul className="mb-2 space-y-1.5">
                  {tasks.map((t, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-xl bg-tint px-3 py-2 text-[15px]">
                      <span className="h-4 w-4 rounded-md border-2 border-theme" />
                      <span className="flex-1">{t}</span>
                      <button onClick={() => setTasks((x) => x.filter((_, j) => j !== i))} aria-label="Remove task" className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <input value={taskDraft} onChange={(e) => setTaskDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && pushTask()} placeholder="e.g. Drink 2L water" className="min-w-0 flex-1 rounded-xl bg-muted px-4 py-3 text-[15px] outline-none ring-1 ring-transparent focus:ring-theme" />
                  <button onClick={pushTask} className="flex items-center gap-1 rounded-xl border border-border px-4 text-sm font-medium hover:bg-muted"><Plus className="h-4 w-4" />Add</button>
                </div>
              </Field>
            </div>

            <div className="sticky bottom-0 flex gap-3 border-t border-border bg-card px-6 py-4 sm:px-8">
              <button onClick={onClose} className="flex-1 rounded-2xl border border-border py-3.5 font-medium hover:bg-muted">Cancel</button>
              <button onClick={save} disabled={!title.trim()} className="flex-[2] rounded-2xl bg-theme py-3.5 font-semibold text-card transition hover:opacity-90 disabled:opacity-40">
                Save activity
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
