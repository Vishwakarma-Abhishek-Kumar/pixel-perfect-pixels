import { type Activity } from "./tracker";
import { safeGetLocalStorage, safeSetLocalStorage } from "./security";

export type ReminderConfig = {
  enabled: boolean;
  intervalMinutes: number; // default 60 (1 hour)
  lastNotifiedAt: number; // timestamp in ms
  sound: boolean;
};

export const DEFAULT_REMINDER_CONFIG: ReminderConfig = {
  enabled: true,
  intervalMinutes: 60,
  lastNotifiedAt: 0,
  sound: true,
};

export type PendingTask = {
  activityId: string;
  activityTitle: string;
  taskId: string;
  taskTitle: string;
};

export const REMINDERS_STORAGE_KEY = "daybook:hourly-reminders:v1";

/**
 * Extracts all incomplete tasks for a given list of activities.
 */
export function getPendingTasks(activities: Activity[]): PendingTask[] {
  const pending: PendingTask[] = [];
  for (const a of activities) {
    for (const t of a.tasks) {
      if (!t.completed) {
        pending.push({
          activityId: a.id,
          activityTitle: a.title,
          taskId: t.id,
          taskTitle: t.title,
        });
      }
    }
  }
  return pending;
}

/**
 * Determines whether a reminder notification should fire based on elapsed time and pending tasks.
 */
export function shouldTriggerReminder({
  config,
  pendingCount,
  now = Date.now(),
}: {
  config: ReminderConfig;
  pendingCount: number;
  now?: number;
}): boolean {
  if (!config.enabled) return false;
  if (pendingCount <= 0) return false;

  const intervalMs = Math.max(1, config.intervalMinutes) * 60 * 1000;
  return now - config.lastNotifiedAt >= intervalMs;
}

/**
 * Creates friendly, motivating notification copy for uncompleted tasks.
 */
export function formatReminderMessage(
  pendingTasks: PendingTask[],
  dateLabel = "Today",
): { title: string; body: string } {
  const count = pendingTasks.length;
  const title = `Daybook · ${count} pending task${count === 1 ? "" : "s"} for ${dateLabel}`;

  const firstTask = pendingTasks[0];
  if (count === 1 && firstTask) {
    return {
      title,
      body: `Don't forget to complete: "${firstTask.taskTitle}" in ${firstTask.activityTitle}. Tap to check it off!`,
    };
  }

  const secondTask = pendingTasks[1];
  const listItems = [firstTask?.taskTitle, secondTask?.taskTitle]
    .filter((t): t is string => Boolean(t))
    .map((t) => `• ${t}`)
    .join("\n");

  const extra = count > 2 ? `\n(+${count - 2} more)` : "";

  return {
    title,
    body: `You still have ${count} tasks to checkout for ${dateLabel}:\n${listItems}${extra}\nKeep your streak going!`,
  };
}

/**
 * Check if the browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Get current notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  try {
    return await Notification.requestPermission();
  } catch (err) {
    console.warn("Failed to request notification permission:", err);
    return "denied";
  }
}

/**
 * Trigger browser / OS notification
 */
export async function showWebNotification(
  title: string,
  options?: NotificationOptions,
): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return false;
  }

  try {
    // Attempt ServiceWorker notification for mobile/desktop background notification center
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready.catch(() => null);
      if (reg && "showNotification" in reg) {
        await reg.showNotification(title, {
          icon: "/icon-192.png",
          badge: "/icon.svg",
          tag: "daybook-hourly-reminder",
          ...options,
        });
        return true;
      }
    }

    // Direct Notification fallback
    new Notification(title, {
      icon: "/icon-192.png",
      tag: "daybook-hourly-reminder",
      ...options,
    });
    return true;
  } catch (err) {
    console.warn("Failed to dispatch web notification:", err);
    return false;
  }
}

/**
 * Gentle Web Audio synthesizer chime for audio feedback
 */
export function playGentleChime(): void {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })["webkitAudioContext"];
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    // Harmonic bell chord (D5 -> A5)
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(880, now); // A5

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.75);
    osc2.stop(now + 0.75);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 900);
  } catch {
    // Audio playback may be restricted until user interacts with the page
  }
}

/**
 * Loads reminder configuration from safe localStorage
 */
export function loadReminderConfig(): ReminderConfig {
  try {
    const raw = safeGetLocalStorage(REMINDERS_STORAGE_KEY);
    if (!raw) return DEFAULT_REMINDER_CONFIG;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return DEFAULT_REMINDER_CONFIG;

    return {
      enabled: typeof parsed["enabled"] === "boolean" ? parsed["enabled"] : true,
      intervalMinutes:
        typeof parsed["intervalMinutes"] === "number" ? parsed["intervalMinutes"] : 60,
      lastNotifiedAt: typeof parsed["lastNotifiedAt"] === "number" ? parsed["lastNotifiedAt"] : 0,
      sound: typeof parsed["sound"] === "boolean" ? parsed["sound"] : true,
    };
  } catch {
    return DEFAULT_REMINDER_CONFIG;
  }
}

/**
 * Persists reminder configuration
 */
export function saveReminderConfig(config: ReminderConfig): void {
  safeSetLocalStorage(REMINDERS_STORAGE_KEY, JSON.stringify(config));
}
