import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellRing,
  BellOff,
  Check,
  Clock,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  AlertCircle,
  Play,
} from "lucide-react";
import { type RemindersManager } from "@/hooks/use-reminders";

type Props = {
  open: boolean;
  onClose: () => void;
  reminders: RemindersManager;
  date: string | null;
};

export function RemindersModal({ open, onClose, reminders, date }: Props) {
  if (!open) return null;

  const {
    config,
    permission,
    isSupported,
    pendingTasks,
    pendingCount,
    remainingMinutes,
    toggleEnabled,
    enableAndRequestPermission,
    setIntervalMinutes,
    toggleSound,
    sendTestReminder,
  } = reminders;

  const handlePermissionRequest = async () => {
    await enableAndRequestPermission();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 14 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-border/80 bg-card p-6 shadow-2xl sm:p-7"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                {config.enabled ? <BellRing className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="font-display text-xl font-medium sm:text-2xl">Hourly Task Reminders</h3>
                <p className="text-xs text-muted-foreground">
                  Notifies you until every task is checked out for {date || "today"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {/* Status Card */}
            <div
              className={`rounded-2xl border p-4 transition-all ${
                pendingCount > 0 && config.enabled
                  ? "border-accent/40 bg-accent/5"
                  : pendingCount === 0
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-border/60 bg-muted/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        pendingCount > 0 && config.enabled
                          ? "bg-accent animate-pulse"
                          : pendingCount === 0
                            ? "bg-emerald-500"
                            : "bg-muted-foreground"
                      }`}
                    />
                    <h4 className="text-sm font-semibold">
                      {pendingCount > 0
                        ? `${pendingCount} Incomplete Task${pendingCount === 1 ? "" : "s"} Left`
                        : "All Tasks Completed! 🎉"}
                    </h4>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {pendingCount > 0
                      ? config.enabled
                        ? `Reminders active every ${config.intervalMinutes === 60 ? "1 hour" : `${config.intervalMinutes}m`} until all items are completed.`
                        : "Reminders are currently paused."
                      : "No reminders will fire until there are uncompleted tasks for this date."}
                  </p>
                </div>
                {config.enabled && pendingCount > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold text-accent">
                    <Clock className="h-3 w-3" />
                    {remainingMinutes <= 1 ? "Due soon" : `In ~${remainingMinutes}m`}
                  </span>
                )}
              </div>

              {/* Pending tasks preview list */}
              {pendingCount > 0 && (
                <div className="mt-3.5 border-t border-border/40 pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Waiting for checkout:
                  </p>
                  <ul className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs text-foreground/90">
                    {pendingTasks.map((pt) => (
                      <li key={pt.taskId} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                        <span className="truncate">{pt.taskTitle}</span>
                        <span className="text-[10px] text-muted-foreground">({pt.activityTitle})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Browser Permission Notification Banner */}
            {isSupported && permission !== "granted" && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <div>
                      <h4 className="text-xs font-bold text-amber-800 dark:text-amber-200">
                        Browser Permission Needed
                      </h4>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        To receive system notifications on your phone or desktop, please allow
                        notifications.
                      </p>
                    </div>
                    {permission === "denied" ? (
                      <p className="text-[11px] text-amber-800 dark:text-amber-200 italic">
                        Notifications are blocked in your browser settings. Tap the padlock/settings
                        icon in your browser URL bar to allow them.
                      </p>
                    ) : (
                      <button
                        onClick={handlePermissionRequest}
                        className="rounded-full bg-amber-600 px-4 py-1.5 text-xs font-bold text-white shadow-soft hover:bg-amber-700 transition"
                      >
                        Allow Notifications
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isSupported && permission === "granted" && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4" />
                <span>Browser notifications permitted and active</span>
              </div>
            )}

            {/* Main Toggle: Enable / Disable */}
            <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-4">
              <div>
                <h4 className="text-sm font-semibold">Enable Hourly Reminders</h4>
                <p className="text-xs text-muted-foreground">
                  Repeat every 1 hour until no pending tasks remain
                </p>
              </div>
              <button
                onClick={toggleEnabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.enabled ? "bg-accent" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Reminder Interval Choice */}
            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Reminder Interval
              </label>
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                {[
                  { mins: 60, label: "1 hour", badge: "Default" },
                  { mins: 30, label: "30 mins", badge: "Frequent" },
                  { mins: 120, label: "2 hours", badge: "Relaxed" },
                ].map((opt) => (
                  <button
                    key={opt.mins}
                    onClick={() => setIntervalMinutes(opt.mins)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs transition ${
                      config.intervalMinutes === opt.mins
                        ? "border-accent bg-accent/10 font-bold text-accent shadow-xs"
                        : "border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[10px] opacity-70">({opt.badge})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gentle Sound Chime Option */}
            <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-foreground">
                  {config.sound ? <Volume2 className="h-4 w-4 text-accent" /> : <VolumeX className="h-4 w-4" />}
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Sound Chime</h4>
                  <p className="text-xs text-muted-foreground">Play a gentle harmonic chime</p>
                </div>
              </div>
              <button
                onClick={toggleSound}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.sound ? "bg-accent" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.sound ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Test Notification Trigger */}
            <div className="pt-2">
              <button
                onClick={() => sendTestReminder()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-muted/60 py-3 text-xs font-semibold text-foreground transition hover:bg-muted"
              >
                <Play className="h-3.5 w-3.5 text-accent" />
                <span>Send Test Notification Now</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
