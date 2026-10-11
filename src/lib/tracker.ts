export type ThemeKey =
  | "calm"
  | "focus"
  | "energy"
  | "learn"
  | "creative"
  | "home"
  | "finance"
  | "love"
  | "habits"
  | "personal";

export type Task = { id: string; title: string; completed: boolean };

export type Activity = {
  id: string;
  title: string;
  icon: string;
  theme: ThemeKey;
  description?: string | undefined;
  tasks: Task[];
};

export type DayData = { date: string; activities: Activity[] };

export const THEMES: { key: ThemeKey; label: string }[] = [
  { key: "calm", label: "Calm" },
  { key: "focus", label: "Focus" },
  { key: "energy", label: "Energy" },
  { key: "learn", label: "Learn" },
  { key: "creative", label: "Creative" },
  { key: "home", label: "Home" },
  { key: "finance", label: "Finance" },
  { key: "love", label: "Love" },
  { key: "habits", label: "Habits" },
  { key: "personal", label: "Personal" },
];

export const EMOJIS = [
  "🧘",
  "💻",
  "🏋️",
  "📚",
  "🎨",
  "🏠",
  "💰",
  "❤️",
  "🌱",
  "✨",
  "☕",
  "🍳",
  "🎧",
  "✍️",
  "🧠",
  "🌙",
  "🚶",
  "🛒",
  "📞",
  "🌸",
];

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const parseKey = (k: string) => {
  const [y = 1970, m = 1, d = 1] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const shiftKey = (k: string, days: number) => {
  const d = parseKey(k);
  d.setDate(d.getDate() + days);
  return dateKey(d);
};

export function progressOf(activities: Activity[]) {
  const tasks = activities.flatMap((a) => a.tasks);
  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, pct };
}

export function motivation(pct: number, total: number) {
  if (total === 0) return "A blank page. Plant a few intentions.";
  if (pct === 100) return "Every box checked. Rest well — you earned it.";
  if (pct >= 75) return "Almost there. Finish with grace.";
  if (pct >= 50) return "Past the halfway mark. Keep the rhythm.";
  if (pct >= 25) return "Momentum is building. Lovely work.";
  if (pct > 0) return "A beautiful start. One small step at a time.";
  return "Make today count.";
}

export function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function copyForNewDay(activities: Activity[]): Activity[] {
  return activities.map((a) => ({
    ...a,
    id: uid(),
    tasks: a.tasks.map((x) => ({ ...x, id: uid(), completed: false })),
  }));
}
