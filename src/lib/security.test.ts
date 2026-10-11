import { describe, it, expect } from "vitest";
import {
  sanitizeText,
  validateStoreData,
  safeSetLocalStorage,
  safeGetLocalStorage,
} from "./security";

describe("security & data safety", () => {
  it("sanitizes text by stripping invisible control chars and enforcing max length", () => {
    const malicious = "Hello\u0000\u001F\u202EWorld   ";
    expect(sanitizeText(malicious, 10)).toBe("HelloWorld");
  });

  it("handles null or non-string inputs safely in sanitizeText", () => {
    expect(sanitizeText(null)).toBe("");
    expect(sanitizeText(undefined)).toBe("");
    expect(sanitizeText(123)).toBe("");
  });

  it("validates valid store data successfully", () => {
    const raw = {
      name: "Abhishek",
      days: {
        "2026-10-11": [
          {
            id: "act-1",
            title: "Morning Routine",
            icon: "🧘",
            theme: "calm",
            description: "Daily meditation and stretch",
            tasks: [{ id: "t-1", title: "10m meditation", completed: true }],
          },
        ],
      },
    };
    const validated = validateStoreData(raw);
    expect(validated.name).toBe("Abhishek");
    expect(validated.days["2026-10-11"]).toHaveLength(1);
    expect(validated.days["2026-10-11"]?.[0]?.tasks[0]?.completed).toBe(true);
  });

  it("defends against prototype pollution and corrupted formats", () => {
    const polluted = JSON.parse(
      '{"__proto__": {"admin": true}, "name": "Test", "days": "not-an-object"}',
    );
    const validated = validateStoreData(polluted);
    expect(validated.name).toBe("Test");
    expect(validated.days).toEqual({});
    expect(({} as Record<string, unknown>)["admin"]).toBeUndefined();
  });

  it("partially recovers valid days if one day contains corrupted items", () => {
    const mixed = {
      name: "Safe Name",
      days: {
        "2026-10-11": [
          { id: "valid-1", title: "Gym", icon: "🏋️", theme: "energy", tasks: [] },
          { id: 123, title: null }, // corrupted activity
        ],
        "invalid-date-format": [{ id: "bad", title: "Bad" }],
      },
    };
    const validated = validateStoreData(mixed);
    expect(validated.name).toBe("Safe Name");
    expect(validated.days["2026-10-11"]).toHaveLength(1);
    expect(validated.days["2026-10-11"]?.[0]?.title).toBe("Gym");
    expect(validated.days["invalid-date-format"]).toBeUndefined();
  });

  it("safe storage helpers handle localStorage gracefully", () => {
    const success = safeSetLocalStorage("test-key", "test-val");
    expect(success).toBe(true);
    expect(safeGetLocalStorage("test-key")).toBe("test-val");
  });
});
