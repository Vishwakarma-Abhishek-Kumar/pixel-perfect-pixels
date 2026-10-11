import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useTracker } from "@/hooks/use-tracker";
import { dateKey, progressOf, shiftKey } from "@/lib/tracker";
import { DailyHeader, DateNavigator, ProgressOverview, EmptyState } from "./Header";
import { ActivityBoard } from "./ActivityBoard";
import { AddActivityModal } from "./AddActivityModal";

export function Dashboard() {
  const tr = useTracker();
  const [date, setDate] = useState<string | null>(null);
  const [modal, setModal] = useState(false);

  useEffect(() => setDate(dateKey(new Date())), []);

  if (!tr.loaded || !date) return <div className="min-h-screen bg-background" />;

  const activities = tr.getDay(date);
  const prog = progressOf(activities);
  const prev = shiftKey(date, -1);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent opacity-[0.07] blur-3xl" />
      <main className="relative mx-auto max-w-[1500px] px-4 pb-32 pt-8 sm:px-8 sm:pt-12 lg:px-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <DailyHeader name={tr.name} onName={tr.setName} date={date} />
          <DateNavigator date={date} onChange={setDate} />
        </div>

        <div className="mt-8 sm:mt-10">
          <ProgressOverview {...prog} />
        </div>

        <div className="mb-5 mt-10 flex items-center justify-between sm:mb-6 sm:mt-14">
          <h2 className="font-display text-2xl font-medium sm:text-3xl">Your board</h2>
          <button onClick={() => setModal(true)} className="hidden items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift sm:flex">
            <Plus className="h-4 w-4" /> Add Activity
          </button>
        </div>

        {activities.length === 0 ? (
          <EmptyState
            onAdd={() => setModal(true)}
            onCopy={() => tr.copyFrom(prev, date)}
            onSeed={() => tr.seed(date)}
            canCopy={tr.getDay(prev).length > 0}
          />
        ) : (
          <ActivityBoard
            activities={activities}
            onReorder={(l) => tr.reorderActivities(date, l)}
            actionsFor={(id) => ({
              onAddTask: (t) => tr.addTask(date, id, t),
              onUpdateTask: (tid, p) => tr.updateTask(date, id, tid, p),
              onRemoveTask: (tid) => tr.removeTask(date, id, tid),
              onReorderTasks: (tasks) => tr.reorderTasks(date, id, tasks),
              onDelete: () => tr.removeActivity(date, id),
            })}
          />
        )}
      </main>

      <button onClick={() => setModal(true)} aria-label="Add activity" className="fixed bottom-6 right-5 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lift transition active:scale-95 sm:hidden">
        <Plus className="h-7 w-7" />
      </button>

      <AddActivityModal open={modal} onClose={() => setModal(false)} onCreate={(a) => tr.addActivity(date, a)} />
    </div>
  );
}
