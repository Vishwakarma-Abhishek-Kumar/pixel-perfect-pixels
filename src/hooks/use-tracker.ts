import { useCallback, useEffect, useState } from "react";
import { type Activity, type Task, copyForNewDay, uid } from "@/lib/tracker";
import {
  validateStoreData,
  safeSetLocalStorage,
  safeGetLocalStorage,
  sanitizeText,
} from "@/lib/security";

const KEY = "daily-board:v2";
const OLD_KEY = "daily-board:v1";

const DUMMY_TITLES = new Set(["Self Care", "Work", "Fitness", "Learning", "Home", "Habits"]);

function sanitizeDays(days: Record<string, Activity[]> = {}): Record<string, Activity[]> {
  const cleaned: Record<string, Activity[]> = {};
  for (const [date, acts] of Object.entries(days)) {
    if (!Array.isArray(acts)) continue;
    const remaining = acts.filter((a) => !DUMMY_TITLES.has(a.title));
    if (remaining.length > 0) {
      cleaned[date] = remaining;
    }
  }
  return cleaned;
}

type Store = { name: string; days: Record<string, Activity[]> };

export function useTracker() {
  const [store, setStore] = useState<Store>({ name: "", days: {} });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const v2 = safeGetLocalStorage(KEY);
      if (v2) {
        const validated = validateStoreData(JSON.parse(v2));
        setStore({ name: validated.name, days: sanitizeDays(validated.days) });
      } else {
        const v1 = safeGetLocalStorage(OLD_KEY);
        if (v1) {
          const validated = validateStoreData(JSON.parse(v1));
          setStore({ name: validated.name, days: sanitizeDays(validated.days) });
        } else {
          setStore({ name: "", days: {} });
        }
      }
    } catch {
      setStore({ name: "", days: {} });
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) safeSetLocalStorage(KEY, JSON.stringify(store));
  }, [store, loaded]);

  const setDay = useCallback((date: string, fn: (a: Activity[]) => Activity[]) => {
    setStore((s) => ({ ...s, days: { ...s.days, [date]: fn(s.days[date] ?? []) } }));
  }, []);

  const editActivity = (date: string, id: string, fn: (a: Activity) => Activity) =>
    setDay(date, (list) => list.map((a) => (a.id === id ? fn(a) : a)));

  return {
    loaded,
    name: store.name,
    setName: (name: string) => setStore((s) => ({ ...s, name: sanitizeText(name, 50) })),
    getDay: (date: string) => store.days[date] ?? [],
    addActivity: (date: string, a: Omit<Activity, "id">) =>
      setDay(date, (l) => [
        ...l,
        {
          ...a,
          id: uid(),
          title: sanitizeText(a.title, 100),
          icon: sanitizeText(a.icon, 20) || "✨",
          description: a.description ? sanitizeText(a.description, 400) : undefined,
        },
      ]),
    removeActivity: (date: string, id: string) => setDay(date, (l) => l.filter((a) => a.id !== id)),
    reorderActivities: (date: string, list: Activity[]) => setDay(date, () => list),
    copyFrom: (from: string, to: string) => setDay(to, () => copyForNewDay(store.days[from] ?? [])),
    clearDay: (date: string) => setDay(date, () => []),
    addTask: (date: string, aid: string, title: string) =>
      editActivity(date, aid, (a) => ({
        ...a,
        tasks: [...a.tasks, { id: uid(), title: sanitizeText(title, 250), completed: false }],
      })),
    updateTask: (date: string, aid: string, tid: string, patch: Partial<Task>) =>
      editActivity(date, aid, (a) => ({
        ...a,
        tasks: a.tasks.map((t) =>
          t.id === tid
            ? {
                ...t,
                ...patch,
                title: patch.title !== undefined ? sanitizeText(patch.title, 250) : t.title,
              }
            : t,
        ),
      })),
    removeTask: (date: string, aid: string, tid: string) =>
      editActivity(date, aid, (a) => ({ ...a, tasks: a.tasks.filter((t) => t.id !== tid) })),
    getStore: () => store,
    restoreStore: (imported: unknown) => {
      const validated = validateStoreData(imported);
      setStore({
        name: validated.name || store.name,
        days: sanitizeDays(validated.days),
      });
    },
    reorderTasks: (date: string, aid: string, tasks: Task[]) =>
      editActivity(date, aid, (a) => ({ ...a, tasks })),
  };
}

export type Tracker = ReturnType<typeof useTracker>;
