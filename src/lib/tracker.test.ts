import { describe, it, expect } from "vitest";
import { progressOf, copyForNewDay, shiftKey, type Activity } from "./tracker";

const acts: Activity[] = [
  {
    id: "a",
    title: "A",
    icon: "x",
    theme: "calm",
    tasks: [
      { id: "1", title: "t", completed: true },
      { id: "2", title: "t", completed: true },
      { id: "3", title: "t", completed: false },
    ],
  },
  {
    id: "b",
    title: "B",
    icon: "x",
    theme: "focus",
    tasks: [
      { id: "4", title: "t", completed: false },
      { id: "5", title: "t", completed: true },
    ],
  },
];

describe("tracker rules", () => {
  it("counts completed vs total tasks across activities", () => {
    expect(progressOf(acts)).toEqual({ done: 3, total: 5, pct: 60 });
  });
  it("empty day is 0%", () => {
    expect(progressOf([]).pct).toBe(0);
  });
  it("copying to a new day resets completion", () => {
    expect(
      copyForNewDay(acts)
        .flatMap((a) => a.tasks)
        .some((t) => t.completed),
    ).toBe(false);
  });
  it("shifts dates across month boundaries", () => {
    expect(shiftKey("2026-10-31", 1)).toBe("2026-11-01");
  });
});
