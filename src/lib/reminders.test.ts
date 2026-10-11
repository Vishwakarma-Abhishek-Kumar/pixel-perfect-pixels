import { describe, it, expect, beforeEach } from "vitest";
import {
  getPendingTasks,
  shouldTriggerReminder,
  formatReminderMessage,
  loadReminderConfig,
  saveReminderConfig,
  DEFAULT_REMINDER_CONFIG,
  REMINDERS_STORAGE_KEY,
  type ReminderConfig,
} from "./reminders";
import { type Activity } from "./tracker";

const sampleActivities: Activity[] = [
  {
    id: "act-1",
    title: "Morning Routine",
    icon: "🧘",
    theme: "calm",
    tasks: [
      { id: "t-1", title: "Meditate 10 mins", completed: true },
      { id: "t-2", title: "Drink warm water", completed: false },
    ],
  },
  {
    id: "act-2",
    title: "Deep Work",
    icon: "💻",
    theme: "focus",
    tasks: [
      { id: "t-3", title: "Draft report", completed: false },
      { id: "t-4", title: "Review PR", completed: true },
    ],
  },
];

describe("reminders logic", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("extracts only pending (uncompleted) tasks across activities", () => {
    const pending = getPendingTasks(sampleActivities);
    expect(pending).toHaveLength(2);
    expect(pending[0]?.taskTitle).toBe("Drink warm water");
    expect(pending[1]?.taskTitle).toBe("Draft report");
  });

  it("returns empty array if all tasks are completed", () => {
    const completedActivities: Activity[] = [
      {
        id: "act-1",
        title: "Workout",
        icon: "🏋️",
        theme: "energy",
        tasks: [{ id: "t-1", title: "Pushups", completed: true }],
      },
    ];
    expect(getPendingTasks(completedActivities)).toEqual([]);
  });

  it("shouldTriggerReminder returns false if reminders are disabled", () => {
    const config: ReminderConfig = {
      enabled: false,
      intervalMinutes: 60,
      lastNotifiedAt: 0,
      sound: true,
    };
    expect(shouldTriggerReminder({ config, pendingCount: 3, now: Date.now() })).toBe(false);
  });

  it("shouldTriggerReminder returns false if pending count is 0 (all tasks completed)", () => {
    const config: ReminderConfig = {
      enabled: true,
      intervalMinutes: 60,
      lastNotifiedAt: 0,
      sound: true,
    };
    expect(shouldTriggerReminder({ config, pendingCount: 0, now: Date.now() })).toBe(false);
  });

  it("shouldTriggerReminder returns false if 1 hour has not yet elapsed", () => {
    const now = 1_000_000;
    const config: ReminderConfig = {
      enabled: true,
      intervalMinutes: 60,
      lastNotifiedAt: now - 30 * 60 * 1000, // 30 minutes ago
      sound: true,
    };
    expect(shouldTriggerReminder({ config, pendingCount: 2, now })).toBe(false);
  });

  it("shouldTriggerReminder returns true once 1 hour (60 mins) has elapsed with pending tasks", () => {
    const now = 1_000_000;
    const config: ReminderConfig = {
      enabled: true,
      intervalMinutes: 60,
      lastNotifiedAt: now - 60 * 60 * 1000, // exactly 60 minutes ago
      sound: true,
    };
    expect(shouldTriggerReminder({ config, pendingCount: 2, now })).toBe(true);
  });

  it("formats single and multi-task reminder copy clearly", () => {
    const single = [{ activityId: "1", activityTitle: "Gym", taskId: "t1", taskTitle: "Bench press" }];
    const msg1 = formatReminderMessage(single, "Today");
    expect(msg1.title).toContain("1 pending task for Today");
    expect(msg1.body).toContain("Bench press");

    const multi = [
      { activityId: "1", activityTitle: "Gym", taskId: "t1", taskTitle: "Bench press" },
      { activityId: "2", activityTitle: "Study", taskId: "t2", taskTitle: "Math Chapter 4" },
      { activityId: "3", activityTitle: "Home", taskId: "t3", taskTitle: "Clean dishes" },
    ];
    const msgMulti = formatReminderMessage(multi, "Today");
    expect(msgMulti.title).toContain("3 pending tasks for Today");
    expect(msgMulti.body).toContain("Bench press");
    expect(msgMulti.body).toContain("+1 more");
  });

  it("loads and saves reminder configuration to localStorage", () => {
    expect(loadReminderConfig()).toEqual(DEFAULT_REMINDER_CONFIG);

    const custom: ReminderConfig = {
      enabled: true,
      intervalMinutes: 60,
      lastNotifiedAt: 123456,
      sound: false,
    };
    saveReminderConfig(custom);
    expect(loadReminderConfig()).toEqual(custom);
  });
});
