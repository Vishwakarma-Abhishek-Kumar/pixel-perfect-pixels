import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Sparkles, Check, Trash2 } from "lucide-react";
import { EMOJIS, THEMES, type Activity, type ThemeKey, uid } from "@/lib/tracker";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (a: Omit<Activity, "id">) => void;
};

// Curated inspiration presets to kickstart ideas with 1 tap
const PRESETS: {
  label: string;
  title: string;
  icon: string;
  theme: ThemeKey;
  description: string;
  tasks: string[];
}[] = [
  {
    label: "🧘 Morning Calm",
    title: "Morning Rituals",
    icon: "🧘",
    theme: "calm",
    description: "Gentle grounding for a serene day",
    tasks: [
      "Drink large glass of water",
      "10 min stretch & breathwork",
      "No screens first 30 mins",
    ],
  },
  {
    label: "💻 Deep Focus",
    title: "Deep Work Sprint",
    icon: "💻",
    theme: "focus",
    description: "Dedicated uninterrupted productive flow",
    tasks: ["Identify top 2 priorities", "90 min focused session", "Clear pending emails"],
  },
  {
    label: "🏋️ Daily Sweat",
    title: "Movement & Fitness",
    icon: "🏋️",
    theme: "energy",
    description: "Energizing the body and mind",
    tasks: ["45 min strength or cardio", "Post-workout hydration", "Stretch & cool down"],
  },
  {
    label: "📚 Reading Hour",
    title: "Learning & Growth",
    icon: "📚",
    theme: "learn",
    description: "Nourish the mind with new knowledge",
    tasks: ["Read 20 pages of current book", "Write down 1 key insight"],
  },
  {
    label: "🌱 Daily Habits",
    title: "Micro Habits",
    icon: "🌱",
    theme: "habits",
    description: "Small positive daily repetitions",
    tasks: ["Evening reflection journal", "Tidy desk before bed"],
  },
];

const EMOJI_CATEGORIES = [
  { label: "Popular", list: ["✨", "🧘", "💻", "🏋️", "📚", "🎨", "🏠", "💡", "🌱", "☕"] },
  { label: "Wellness", list: ["🌸", "🌙", "🚶", "🍵", "🍎", "🛁", "🧠", "💊", "🥗", "🕊️"] },
  { label: "Focus & Work", list: ["✍️", "🎧", "🎯", "💼", "📅", "📝", "🚀", "📊", "🔍", "⏱️"] },
  { label: "Lifestyle", list: ["🍳", "🛒", "❤️", "🐾", "🎸", "🧹", "💰", "🪴", "🚲", "🌅"] },
];

const QUICK_TASK_IDEAS = [
  "Drink 2L water",
  "15 min walk",
  "Read 10 pages",
  "Review weekly goals",
  "Meditate for 10 min",
  "Healthy lunch",
];

export function AddActivityModal({ open, onClose, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("✨");
  const [theme, setTheme] = useState<ThemeKey>("calm");
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState<string[]>([]);
  const [taskDraft, setTaskDraft] = useState("");
  const [emojiCategory, setEmojiCategory] = useState("Popular");
  const [customEmoji, setCustomEmoji] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setIcon("✨");
      setTheme("calm");
      setDescription("");
      setTasks([]);
      setTaskDraft("");
      setCustomEmoji("");
      setEmojiCategory("Popular");
    }
  }, [open]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);

  const pushTask = () => {
    const v = taskDraft.trim();
    if (v && !tasks.includes(v)) {
      setTasks((t) => [...t, v]);
    }
    setTaskDraft("");
  };

  const addQuickIdea = (idea: string) => {
    if (!tasks.includes(idea)) {
      setTasks((t) => [...t, idea]);
    }
  };

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setTitle(preset.title);
    setIcon(preset.icon);
    setTheme(preset.theme);
    setDescription(preset.description);
    setTasks([...preset.tasks]);
  };

  const handleCustomEmoji = (val: string) => {
    setCustomEmoji(val);
    if (val.trim()) {
      // Pick first character / emoji
      const first = Array.from(val.trim())[0];
      if (first) setIcon(first);
    }
  };

  const save = () => {
    if (!title.trim()) return;
    const allTasks =
      taskDraft.trim() && !tasks.includes(taskDraft.trim()) ? [...tasks, taskDraft.trim()] : tasks;

    onCreate({
      title: title.trim(),
      icon,
      theme,
      description: description.trim() || undefined,
      tasks: allTasks.map((t) => ({ id: uid(), title: t, completed: false })),
    });
    onClose();
  };

  const currentEmojis = useMemo(() => {
    const cat = EMOJI_CATEGORIES.find((c) => c.label === emojiCategory);
    return cat ? cat.list : EMOJIS;
  }, [emojiCategory]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />

          {/* Dialog Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Create activity"
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className={`theme-${theme} relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-[2.25rem] bg-card text-foreground shadow-lift sm:rounded-[2.25rem] border border-border/70`}
          >
            {/* Top Header Bar */}
            <div className="card-surface shrink-0 border-b border-border/60 px-5 pt-3.5 pb-3.5 sm:px-8 sm:pt-5 sm:pb-4">
              {/* Mobile handle */}
              <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-border/80 sm:hidden" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold">
                    📌
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-bold leading-tight sm:text-2xl">
                      Create Activity
                    </h2>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">
                      Pin a new ritual or habit to your board
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 sm:px-8 sm:py-6 sm:space-y-6">
              {/* Quick Inspiration Presets */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-2">
                  Quick Presets
                </p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="shrink-0 rounded-full border border-border/70 bg-card/90 px-3 py-1.5 text-xs font-semibold text-foreground/80 hover:bg-card hover:text-foreground hover:border-accent hover:shadow-xs transition"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="rounded-2xl border border-border/70 bg-card/85 p-3.5 shadow-soft transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-card text-2xl shadow-xs border border-border/40">
                    {icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm sm:text-base font-semibold leading-snug truncate text-foreground">
                      {title.trim() || "Your Activity Title"}
                    </p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                      {description.trim() || "Description note appears here"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="rounded-full bg-tint px-2.5 py-1 text-[11px] font-bold text-theme">
                      {THEMES.find((t) => t.key === theme)?.label}
                    </span>
                  </div>
                </div>

                {/* Progress bar preview */}
                <div className="mt-2.5 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                  <span>0 of {tasks.length || 1} tasks completed</span>
                  <span className="text-theme font-semibold">0%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-1/12 rounded-full bg-theme opacity-50" />
                </div>
              </div>
              {/* Activity Title Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Activity Name <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-tint text-2xl shadow-soft border border-theme/30">
                    {icon}
                  </div>
                  <input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Morning Routine, Work Flow..."
                    className="flex-1 rounded-2xl border border-border bg-muted/60 px-4 py-3 font-display text-lg text-foreground outline-none ring-1 ring-transparent focus:border-theme focus:ring-2 focus:ring-theme/30 transition placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              {/* Theme Color Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                  Color Theme Palette
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {THEMES.map((t) => {
                    const isSelected = theme === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setTheme(t.key)}
                        className={`theme-${t.key} flex items-center gap-2 rounded-xl border p-2 text-xs font-medium transition-all ${
                          isSelected
                            ? "border-theme bg-tint font-bold shadow-xs scale-102 ring-1 ring-theme"
                            : "border-border/70 bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="h-3 w-3 shrink-0 rounded-full bg-theme" />
                        <span className="truncate">{t.label}</span>
                        {isSelected && <Check className="ml-auto h-3 w-3 text-theme" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Emoji Icon Picker */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Choose Icon
                  </label>
                  {/* Category switcher */}
                  <div className="flex items-center gap-1">
                    {EMOJI_CATEGORIES.map((cat) => (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => setEmojiCategory(cat.label)}
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${
                          emojiCategory === cat.label
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-2 rounded-2xl border border-border/70 bg-card">
                  {currentEmojis.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setIcon(e)}
                      className={`flex aspect-square items-center justify-center rounded-xl text-xl transition-transform hover:scale-110 active:scale-95 ${
                        icon === e ? "bg-tint ring-2 ring-theme shadow-xs" : "hover:bg-muted"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>

                {/* Custom emoji write-in */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Custom:</span>
                  <input
                    type="text"
                    value={customEmoji}
                    onChange={(e) => handleCustomEmoji(e.target.value)}
                    placeholder="Paste or type any emoji"
                    className="w-44 rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-xs outline-none focus:border-theme"
                  />
                </div>
              </div>

              {/* Description Note (optional) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Note / Intention (Optional)
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. A gentle intention to anchor your focus"
                  className="w-full rounded-2xl border border-border bg-muted/60 px-4 py-3 text-sm text-foreground outline-none ring-1 ring-transparent focus:border-theme focus:ring-2 focus:ring-theme/30 transition placeholder:text-muted-foreground/50"
                />
              </div>

              {/* Tasks Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tasks / Checklist ({tasks.length})
                  </label>
                </div>

                {/* Existing Tasks */}
                {tasks.length > 0 && (
                  <ul className="mb-3 space-y-1.5">
                    {tasks.map((t, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 rounded-xl border border-border/60 bg-tint/60 px-3.5 py-2.5 text-sm transition"
                      >
                        <span className="h-4 w-4 shrink-0 rounded-md border-2 border-theme" />
                        <span className="flex-1 font-medium text-foreground">{t}</span>
                        <button
                          type="button"
                          onClick={() => setTasks((x) => x.filter((_, j) => j !== i))}
                          aria-label={`Remove task ${t}`}
                          className="text-muted-foreground hover:text-destructive p-1 rounded-md transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Add Task Input */}
                <div className="flex gap-2">
                  <input
                    value={taskDraft}
                    onChange={(e) => setTaskDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        pushTask();
                      }
                    }}
                    placeholder="Add a step (e.g. Drink 2L water)"
                    className="min-w-0 flex-1 rounded-2xl border border-border bg-muted/60 px-4 py-3 text-sm text-foreground outline-none ring-1 ring-transparent focus:border-theme focus:ring-2 focus:ring-theme/30 transition placeholder:text-muted-foreground/50"
                  />
                  <button
                    type="button"
                    onClick={pushTask}
                    className="flex items-center gap-1.5 rounded-2xl bg-muted px-4 py-3 text-xs font-bold text-foreground hover:bg-muted/80 transition"
                  >
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </div>

                {/* Quick Task Suggestions */}
                <div className="mt-3">
                  <p className="text-[11px] font-semibold text-muted-foreground/80 mb-1.5">
                    Suggested items:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TASK_IDEAS.map((idea) => {
                      const alreadyAdded = tasks.includes(idea);
                      return (
                        <button
                          key={idea}
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => addQuickIdea(idea)}
                          className={`rounded-full px-2.5 py-1 text-xs transition ${
                            alreadyAdded
                              ? "opacity-40 cursor-default bg-muted text-muted-foreground line-through"
                              : "border border-border/80 bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          + {idea}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-0 flex items-center gap-3 border-t border-border/70 bg-card/95 backdrop-blur-md px-6 py-4 sm:px-8">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-border bg-card py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={!title.trim()}
                className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-theme py-3.5 text-sm font-bold text-card shadow-soft transition hover:opacity-95 hover:shadow-lift active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
              >
                <Sparkles className="h-4 w-4" /> Save Activity Pin
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
