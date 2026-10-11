import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, PartyPopper, Layers } from "lucide-react";
import { greeting, motivation, parseKey, shiftKey, dateKey, THEMES } from "@/lib/tracker";
import { CalendarPopover } from "./CalendarPopover";

// --- Category / Board Filter Chips ---
export function CategoryFilterChips({
  activeFilter,
  onSelectFilter,
  themeCounts,
  totalCount,
}: {
  activeFilter: string;
  onSelectFilter: (f: string) => void;
  themeCounts: Record<string, number>;
  totalCount: number;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => onSelectFilter("all")}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all ${
          activeFilter === "all"
            ? "bg-foreground text-background shadow-xs"
            : "border border-border/60 bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <Layers className="h-3.5 w-3.5" />
        All ({totalCount})
      </button>

      {THEMES.map((t) => {
        const count = themeCounts[t.key] ?? 0;
        if (count === 0 && activeFilter !== t.key) return null;
        return (
          <button
            key={t.key}
            onClick={() => onSelectFilter(t.key)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
              activeFilter === t.key
                ? "bg-foreground text-background shadow-xs font-bold"
                : "border border-border/60 bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span className={`h-2 w-2 rounded-full theme-${t.key} bg-theme`} />
            {t.label} ({count})
          </button>
        );
      })}
    </div>
  );
}

// --- Daily Header ---
export function DailyHeader({
  name,
  onName,
  onOpenNameModal,
  date,
}: {
  name: string;
  onName: (n: string) => void;
  onOpenNameModal?: () => void;
  date: string;
}) {
  const [editing, setEditing] = useState(false);
  const d = parseKey(date);
  const isToday = date === dateKey(new Date());

  const handleNameClick = () => {
    if (onOpenNameModal) {
      onOpenNameModal();
    } else {
      setEditing(true);
    }
  };

  return (
    <div>
      <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-accent">
        {d.toLocaleDateString(undefined, { weekday: "long" })} ·{" "}
        {d.toLocaleDateString(undefined, { month: "long", day: "numeric" })}
      </p>
      <h1 className="mt-2 sm:mt-3 font-display text-3xl min-[400px]:text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.05] tracking-tight">
        {isToday ? greeting(new Date().getHours()) : "Planning ahead"},{" "}
        {editing ? (
          <input
            autoFocus
            defaultValue={name}
            onBlur={(e) => {
              onName(e.target.value.trim());
              setEditing(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            className="w-[8ch] border-b-2 border-accent bg-transparent italic outline-none text-accent"
          />
        ) : (
          <button
            onClick={handleNameClick}
            className="italic decoration-accent decoration-2 underline-offset-8 hover:underline text-foreground cursor-pointer"
            title="Tap to change your name"
          >
            {name || "add name"}
          </button>
        )}{" "}
        <motion.span
          className="inline-block origin-[70%_70%]"
          animate={{ rotate: [0, 18, -8, 18, 0] }}
          transition={{ duration: 1.4, delay: 0.6 }}
        >
          👋
        </motion.span>
      </h1>
    </div>
  );
}

// --- Date Navigator ---
export function DateNavigator({
  date,
  onChange,
  hasActivities,
}: {
  date: string;
  onChange: (d: string) => void;
  hasActivities?: ((d: string) => boolean) | undefined;
}) {
  const today = dateKey(new Date());
  const btn =
    "flex min-h-10 sm:min-h-11 items-center gap-1 rounded-full px-2.5 sm:px-3 text-xs sm:text-sm font-medium transition hover:bg-card";

  return (
    <div className="flex items-center gap-0.5 sm:gap-1 rounded-full border border-border bg-muted/70 p-1 shadow-soft max-w-full">
      <button
        className={btn}
        onClick={() => onChange(shiftKey(date, -1))}
        aria-label="Previous day"
        title="Yesterday"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Yesterday</span>
      </button>
      <button
        onClick={() => onChange(today)}
        className={`min-h-10 sm:min-h-11 rounded-full px-3 sm:px-4 text-xs sm:text-sm font-semibold transition ${
          date === today
            ? "bg-primary text-primary-foreground shadow-xs"
            : "hover:bg-card text-muted-foreground hover:text-foreground"
        }`}
      >
        {date === today ? "Today" : "Back to Today"}
      </button>
      <button
        className={btn}
        onClick={() => onChange(shiftKey(date, 1))}
        aria-label="Next day"
        title="Tomorrow"
      >
        <span className="hidden sm:inline">Tomorrow</span>
        <ChevronRight className="h-4 w-4" />
      </button>
      <CalendarPopover date={date} onSelect={onChange} hasActivities={hasActivities}>
        <button
          className={`${btn} w-10 sm:w-11 justify-center px-0 text-muted-foreground hover:text-foreground`}
          aria-label="Open custom calendar"
          title="Pick a date"
        >
          <CalendarDays className="h-4 w-4" />
        </button>
      </CalendarPopover>
    </div>
  );
}

// --- Progress Overview ---
export function ProgressOverview({
  done,
  total,
  pct,
}: {
  done: number;
  total: number;
  pct: number;
}) {
  const all = total > 0 && done === total;

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-primary p-5 sm:p-8 text-primary-foreground shadow-lift">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-[40%_60%_55%_45%] bg-progress opacity-40 blur-2xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
            Today's progress
          </p>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-2 sm:gap-3">
            <motion.span
              key={pct}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="font-display text-5xl sm:text-7xl font-medium tabular-nums"
            >
              {pct}
              <span className="text-2xl sm:text-3xl opacity-60">%</span>
            </motion.span>
          </div>
          <p className="mt-1 text-xs sm:text-sm opacity-80">
            <b>{done}</b> / {total} tasks completed
          </p>
        </div>
        <p className="max-w-xs font-display text-base sm:text-lg italic leading-snug opacity-90 sm:text-right">
          {motivation(pct, total)}
        </p>
      </div>
      <div className="relative mt-5 sm:mt-6 h-2.5 sm:h-3 overflow-hidden rounded-full bg-primary-foreground/15">
        <motion.div
          className="h-full rounded-full bg-progress"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
        />
      </div>
      <AnimatePresence>
        {all && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative"
          >
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-primary-foreground/10 px-4 py-3">
              <motion.span
                animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2.2 }}
              >
                <PartyPopper className="h-6 w-6 text-accent" />
              </motion.span>
              <span className="font-display text-lg">🎉 You completed everything today!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Empty State ---
export function EmptyState({
  onAdd,
  onCopy,
  canCopy,
}: {
  onAdd: () => void;
  onCopy: () => void;
  canCopy: boolean;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-[2rem] border-2 border-dashed border-border px-6 py-14 text-center">
      <div className="relative mb-6 h-24 w-24">
        <div className="theme-calm absolute left-0 top-2 h-16 w-14 -rotate-12 rounded-2xl bg-tint shadow-soft" />
        <div className="theme-energy absolute right-0 top-0 h-16 w-14 rotate-6 rounded-2xl bg-tint shadow-soft" />
        <div className="absolute bottom-0 left-5 flex h-16 w-14 items-center justify-center rounded-2xl bg-card text-2xl shadow-lift">
          🌤️
        </div>
      </div>
      <h2 className="font-display text-2xl font-medium">A fresh, open day</h2>
      <p className="mt-2 text-muted-foreground">Pin a few activities to shape it.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          onClick={onAdd}
          className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          + Add activity
        </button>
        {canCopy && (
          <button
            onClick={onCopy}
            className="rounded-full border border-border px-5 py-3 text-sm font-medium hover:bg-muted transition"
          >
            Copy previous day
          </button>
        )}
      </div>
    </div>
  );
}
