import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from "lucide-react";
import { parseKey, dateKey, shiftKey } from "@/lib/tracker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type CalendarPopoverProps = {
  date: string;
  onSelect: (date: string) => void;
  hasActivities?: ((date: string) => boolean) | undefined;
  children?: React.ReactNode;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CalendarPopover({ date, onSelect, hasActivities, children }: CalendarPopoverProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = useMemo(() => parseKey(date), [date]);
  const todayKey = useMemo(() => dateKey(new Date()), []);

  // View state for month/year currently browsed in the calendar
  const [viewYear, setViewYear] = useState(() => selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => selectedDate.getMonth());

  // Reset view to selected date when opening
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      const d = parseKey(date);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
    setOpen(nextOpen);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onSelect(todayKey);
    setOpen(false);
  };

  // Calendar grid calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: {
      key: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      hasData: boolean;
    }[] = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const d = new Date(viewYear, viewMonth - 1, dNum);
      const k = dateKey(d);
      days.push({
        key: k,
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: k === todayKey,
        isSelected: k === date,
        hasData: hasActivities ? hasActivities(k) : false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(viewYear, viewMonth, i);
      const k = dateKey(d);
      days.push({
        key: k,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: k === todayKey,
        isSelected: k === date,
        hasData: hasActivities ? hasActivities(k) : false,
      });
    }

    // Next month padding to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(viewYear, viewMonth + 1, i);
      const k = dateKey(d);
      days.push({
        key: k,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: k === todayKey,
        isSelected: k === date,
        hasData: hasActivities ? hasActivities(k) : false,
      });
    }

    return days;
  }, [viewYear, viewMonth, date, todayKey, hasActivities]);

  const monthLabel = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }, [viewYear, viewMonth]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {children || (
          <button
            type="button"
            className="flex min-h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition hover:bg-card hover:text-foreground"
            aria-label="Open calendar"
            title="Choose a date"
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={16}
        className="z-50 w-[calc(100vw-32px)] max-w-[330px] rounded-[1.75rem] border border-border/70 bg-card p-4 sm:p-5 text-foreground shadow-lift backdrop-blur-xl"
      >
        {/* Calendar Header */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-semibold capitalize text-foreground">
              {monthLabel}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleJumpToday}
              className="rounded-full bg-muted/80 px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition"
              title="Jump to today"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handlePrevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Weekday Row */}
        <div className="grid grid-cols-7 mb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((d) => {
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => {
                  onSelect(d.key);
                  setOpen(false);
                }}
                className={`group relative flex h-9 w-9 flex-col items-center justify-center rounded-full text-xs font-medium transition-all duration-150 ${
                  d.isSelected
                    ? "bg-primary text-primary-foreground font-bold shadow-soft scale-105"
                    : d.isToday
                      ? "border border-accent text-accent font-bold hover:bg-muted"
                      : d.isCurrentMonth
                        ? "text-foreground hover:bg-muted/90"
                        : "text-muted-foreground/35 hover:bg-muted/40 hover:text-muted-foreground"
                }`}
              >
                <span>{d.dayNumber}</span>

                {/* Activity Indicator Dot */}
                {d.hasData && (
                  <span
                    className={`absolute bottom-1 h-1 w-1 rounded-full ${
                      d.isSelected ? "bg-primary-foreground" : "bg-accent"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Quick Switch */}
        <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => {
              onSelect(shiftKey(date, -1));
              setOpen(false);
            }}
            className="rounded-full px-2.5 py-1 font-medium hover:bg-muted hover:text-foreground transition"
          >
            ← Yesterday
          </button>
          <button
            type="button"
            onClick={() => {
              onSelect(todayKey);
              setOpen(false);
            }}
            className={`rounded-full px-2.5 py-1 font-semibold transition ${
              date === todayKey
                ? "bg-accent/15 text-accent"
                : "hover:bg-muted hover:text-foreground"
            }`}
          >
            {date === todayKey ? "Viewing Today" : "Go to Today"}
          </button>
          <button
            type="button"
            onClick={() => {
              onSelect(shiftKey(date, 1));
              setOpen(false);
            }}
            className="rounded-full px-2.5 py-1 font-medium hover:bg-muted hover:text-foreground transition"
          >
            Tomorrow →
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
