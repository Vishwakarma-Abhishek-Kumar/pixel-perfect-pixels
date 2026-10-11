import { useEffect, useMemo, useState } from "react";
import { Plus, FilterX, Smartphone } from "lucide-react";
import { useTracker } from "@/hooks/use-tracker";
import { dateKey, progressOf, shiftKey } from "@/lib/tracker";
import {
  CategoryFilterChips,
  DailyHeader,
  DateNavigator,
  ProgressOverview,
  EmptyState,
} from "./Header";
import { ActivityBoard } from "./ActivityBoard";
import { AddActivityModal } from "./AddActivityModal";
import { StorageAndInstallModal } from "./StorageAndInstallModal";
import { WelcomeNameModal } from "./WelcomeNameModal";

export function Dashboard() {
  const tr = useTracker();
  const [date, setDate] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [storageModal, setStorageModal] = useState(false);
  const [nameModal, setNameModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => setDate(dateKey(new Date())), []);

  // Prompt user for their name upon opening if not set
  useEffect(() => {
    if (tr.loaded && !tr.name.trim()) {
      setNameModal(true);
    }
  }, [tr.loaded, tr.name]);

  const activities = useMemo(() => {
    if (!date) return [];
    return tr.getDay(date);
  }, [tr, date]);

  // Compute theme counts for the filter chips
  const themeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of activities) {
      counts[a.theme] = (counts[a.theme] ?? 0) + 1;
    }
    return counts;
  }, [activities]);

  // Filter activities based on category filter
  const filteredActivities = useMemo(() => {
    if (categoryFilter === "all") return activities;
    return activities.filter((a) => a.theme === categoryFilter);
  }, [activities, categoryFilter]);

  if (!tr.loaded || !date) return <div className="min-h-screen bg-background" />;

  const prog = progressOf(activities);
  const prev = shiftKey(date, -1);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Decorative ambient background accents */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent opacity-[0.07] blur-3xl" />

      <main className="relative mx-auto max-w-[1500px] px-4 pb-32 pt-8 sm:px-8 sm:pt-12 lg:px-12">
        {/* Daily Header & Date Navigator */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <DailyHeader
            name={tr.name}
            onName={tr.setName}
            onOpenNameModal={() => setNameModal(true)}
            date={date}
          />
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setStorageModal(true)}
              className="flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold text-foreground backdrop-blur-sm transition hover:bg-muted shadow-soft hover:-translate-y-0.5"
              title="Install app & device storage options"
            >
              <Smartphone className="h-4 w-4 text-accent" />
              <span>Install & Storage</span>
            </button>
            <DateNavigator
              date={date}
              onChange={setDate}
              hasActivities={(k) => tr.getDay(k).length > 0}
            />
          </div>
        </div>

        {/* Progress Overview */}
        <div className="mt-8 sm:mt-10">
          <ProgressOverview {...prog} />
        </div>

        {/* Board Section Header */}
        <div className="mb-5 mt-10 space-y-4 sm:mb-6 sm:mt-14">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl font-medium sm:text-3xl">Your board</h2>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                {filteredActivities.length}{" "}
                {filteredActivities.length === 1 ? "activity" : "activities"}
              </span>

              {categoryFilter !== "all" && (
                <button
                  onClick={() => setCategoryFilter("all")}
                  className="flex items-center gap-1 rounded-full bg-muted/80 px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition"
                  title="Clear filter"
                >
                  <FilterX className="h-3.5 w-3.5" />
                  Show all
                </button>
              )}
            </div>

            <button
              onClick={() => setModal(true)}
              className="hidden items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift sm:flex"
            >
              <Plus className="h-4 w-4" /> Add Activity
            </button>
          </div>

          {/* Filter Chips */}
          {activities.length > 0 && (
            <CategoryFilterChips
              activeFilter={categoryFilter}
              onSelectFilter={setCategoryFilter}
              themeCounts={themeCounts}
              totalCount={activities.length}
            />
          )}
        </div>

        {/* Board Grid or Empty State */}
        {activities.length === 0 ? (
          <EmptyState
            onAdd={() => setModal(true)}
            onCopy={() => tr.copyFrom(prev, date)}
            canCopy={tr.getDay(prev).length > 0}
          />
        ) : filteredActivities.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-border bg-card/60 p-12 text-center">
            <p className="text-base font-semibold text-foreground">
              No activities found in this category
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Switch categories or add a new activity to this board
            </p>
            <button
              onClick={() => setCategoryFilter("all")}
              className="mt-4 rounded-full bg-muted px-4 py-2 text-xs font-bold text-foreground hover:bg-muted/80 transition"
            >
              Show All
            </button>
          </div>
        ) : (
          <ActivityBoard
            activities={filteredActivities}
            onReorder={(l) => {
              if (categoryFilter === "all") {
                tr.reorderActivities(date, l);
              }
            }}
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

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={() => setModal(true)}
        aria-label="Add activity"
        className="fixed bottom-6 right-5 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lift transition active:scale-95 sm:hidden"
      >
        <Plus className="h-7 w-7" />
      </button>

      {/* Add Activity Modal */}
      <AddActivityModal
        open={modal}
        onClose={() => setModal(false)}
        onCreate={(a) => tr.addActivity(date, a)}
      />

      {/* Storage and PWA Installation Modal */}
      <StorageAndInstallModal
        open={storageModal}
        onClose={() => setStorageModal(false)}
        tracker={tr}
        date={date}
      />

      {/* Welcome Name Prompt Modal */}
      <WelcomeNameModal
        open={nameModal}
        initialName={tr.name}
        onSave={tr.setName}
        onClose={() => setNameModal(false)}
      />
    </div>
  );
}
