import { useCallback, useEffect, useState } from "react";
import { type Activity, dateKey } from "@/lib/tracker";
import {
  type ReminderConfig,
  type PendingTask,
  loadReminderConfig,
  saveReminderConfig,
  getPendingTasks,
  shouldTriggerReminder,
  formatReminderMessage,
  getNotificationPermission,
  requestNotificationPermission,
  showWebNotification,
  playGentleChime,
  isNotificationSupported,
} from "@/lib/reminders";

export type InAppReminderBanner = {
  id: string;
  title: string;
  body: string;
  timestamp: number;
};

export function useReminders({
  date,
  activities,
}: {
  date: string | null;
  activities: Activity[];
}) {
  const [config, setConfig] = useState<ReminderConfig>(() => loadReminderConfig());
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    getNotificationPermission(),
  );
  const [recentBanner, setRecentBanner] = useState<InAppReminderBanner | null>(null);

  const pendingTasks: PendingTask[] = activities ? getPendingTasks(activities) : [];
  const pendingCount = pendingTasks.length;

  const isSupported = isNotificationSupported();
  const isToday = Boolean(date && date === dateKey(new Date()));

  // Sync permission if changed
  useEffect(() => {
    if (isSupported) {
      setPermission(getNotificationPermission());
    }
  }, [isSupported]);

  // Save config changes
  const updateConfig = useCallback((patch: Partial<ReminderConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      saveReminderConfig(next);
      return next;
    });
  }, []);

  // Request browser permission and enable
  const enableAndRequestPermission = useCallback(async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === "granted" || res === "default") {
      updateConfig({ enabled: true });
    }
    return res;
  }, [updateConfig]);

  // Dispatch reminder function
  const triggerReminderNow = useCallback(
    async (isTest = false) => {
      const dateLabel = isToday ? "Today" : date || "Today";
      const message = isTest
        ? {
            title: "Daybook · Reminder active",
            body:
              pendingCount > 0
                ? `You have ${pendingCount} pending task(s) for ${dateLabel}. We'll remind you every ${config.intervalMinutes}m until completed!`
                : `All tasks checked out for ${dateLabel}! Add new tasks anytime.`,
          }
        : formatReminderMessage(pendingTasks, dateLabel);

      if (config.sound) {
        playGentleChime();
      }

      await showWebNotification(message.title, {
        body: message.body,
        icon: "/icon-192.png",
      });

      const now = Date.now();
      updateConfig({ lastNotifiedAt: now });

      setRecentBanner({
        id: String(now),
        title: message.title,
        body: message.body,
        timestamp: now,
      });
    },
    [isToday, date, pendingCount, pendingTasks, config.intervalMinutes, config.sound, updateConfig],
  );

  // Periodic reminder scheduler check
  useEffect(() => {
    if (!config.enabled || pendingCount === 0 || !date) {
      return undefined;
    }

    const checkAndTrigger = () => {
      if (
        shouldTriggerReminder({
          config,
          pendingCount,
          now: Date.now(),
        })
      ) {
        triggerReminderNow(false);
      }
    };

    // Check immediately on mount/update
    checkAndTrigger();

    // Check every 20 seconds while page is running
    const interval = setInterval(checkAndTrigger, 20_000);
    return () => clearInterval(interval);
  }, [config, pendingCount, date, triggerReminderNow]);

  // Compute minutes remaining until next reminder
  const intervalMs = config.intervalMinutes * 60 * 1000;
  const elapsedMs = Math.max(0, Date.now() - config.lastNotifiedAt);
  const remainingMinutes =
    pendingCount > 0 && config.enabled
      ? Math.max(0, Math.ceil((intervalMs - elapsedMs) / 60000))
      : 0;

  return {
    config,
    permission,
    isSupported,
    pendingTasks,
    pendingCount,
    remainingMinutes,
    recentBanner,
    dismissBanner: () => setRecentBanner(null),
    updateConfig,
    enableAndRequestPermission,
    toggleEnabled: () => updateConfig({ enabled: !config.enabled }),
    setIntervalMinutes: (mins: number) => updateConfig({ intervalMinutes: mins }),
    toggleSound: () => updateConfig({ sound: !config.sound }),
    sendTestReminder: () => triggerReminderNow(true),
  };
}

export type RemindersManager = ReturnType<typeof useReminders>;
