import { useCallback, useEffect, useState } from "react";
import { type Activity, type Task, dateKey, seedActivities, copyForNewDay, uid } from "@/lib/tracker";

const KEY = "daily-board:v1";
type Store = { name: string; days: Record<string, Activity[]> };

export function useTracker() {
  const [store, setStore] = useState<Store>({ name: "", days: {} });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setStore(JSON.parse(raw));
      else setStore({ name: "", days: { [dateKey(new Date())]: seedActivities() } });
    } catch {
      setStore({ name: "", days: { [dateKey(new Date())]: seedActivities() } });
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(store));
  }, [store, loaded]);

  const setDay = useCallback((date: string, fn: (a: Activity[]) => Activity[]) => {
    setStore((s) => ({ ...s, days: { ...s.days, [date]: fn(s.days[date] ?? []) } }));
  }, []);

  const editActivity = (date: string, id: string, fn: (a: Activity) => Activity) =>
    setDay(date, (list) => list.map((a) => (a.id === id ? fn(a) : a)));

  return {
    loaded,
    name: store.name,
    setName: (name: string) => setStore((s) => ({ ...s, name })),
    getDay: (date: string) => store.days[date] ?? [],
    addActivity: (date: string, a: Omit<Activity, "id">) => setDay(date, (l) => [...l, { ...a, id: uid() }]),
    removeActivity: (date: string, id: string) => setDay(date, (l) => l.filter((a) => a.id !== id)),
    reorderActivities: (date: string, list: Activity[]) => setDay(date, () => list),
    copyFrom: (from: string, to: string) => setDay(to, () => copyForNewDay(store.days[from] ?? [])),
    seed: (date: string) => setDay(date, () => seedActivities()),
    addTask: (date: string, aid: string, title: string) =>
      editActivity(date, aid, (a) => ({ ...a, tasks: [...a.tasks, { id: uid(), title, completed: false }] })),
    updateTask: (date: string, aid: string, tid: string, patch: Partial<Task>) =>
      editActivity(date, aid, (a) => ({ ...a, tasks: a.tasks.map((t) => (t.id === tid ? { ...t, ...patch } : t)) })),
    removeTask: (date: string, aid: string, tid: string) =>
      editActivity(date, aid, (a) => ({ ...a, tasks: a.tasks.filter((t) => t.id !== tid) })),
    reorderTasks: (date: string, aid: string, tasks: Task[]) => editActivity(date, aid, (a) => ({ ...a, tasks })),
  };
}

export type Tracker = ReturnType<typeof useTracker>;
