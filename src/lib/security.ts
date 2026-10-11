import { z } from "zod";
import type { Activity, Task, ThemeKey } from "./tracker";

// Valid theme keys whitelist
const THEME_KEYS: [ThemeKey, ...ThemeKey[]] = [
  "calm",
  "focus",
  "energy",
  "learn",
  "creative",
  "home",
  "finance",
  "love",
  "habits",
  "personal",
];

export function sanitizeText(input: unknown, maxLength = 200): string {
  if (typeof input !== "string") return "";
  let clean = "";
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    // Filter control characters (0-31, 127-159) and bidirectional overrides (8234-8238)
    const isControl = (code >= 0 && code <= 31) || (code >= 127 && code <= 159);
    const isBidi = code >= 8234 && code <= 8238;
    if (!isControl && !isBidi) {
      clean += input[i];
    }
  }
  return clean.trim().slice(0, maxLength);
}

// Strict Zod schema for a single task item
export const TaskSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().transform((v) => sanitizeText(v, 250)),
  completed: z.boolean().default(false),
});

// Strict Zod schema for an activity card
export const ActivitySchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().transform((v) => sanitizeText(v, 100)),
  icon: z
    .string()
    .transform((v) => sanitizeText(v, 20))
    .default("✨"),
  theme: z.enum(THEME_KEYS).default("calm"),
  description: z
    .string()
    .optional()
    .transform((v) => (v ? sanitizeText(v, 400) : undefined)),
  tasks: z.array(TaskSchema).max(200).default([]),
});

// Strict Zod schema for entire app storage (prevents prototype pollution and corrupted formats)
export const StoreSchema = z.object({
  name: z
    .string()
    .transform((v) => sanitizeText(v, 50))
    .default(""),
  days: z
    .record(
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
      z.array(ActivitySchema).max(100),
    )
    .default({}),
});

export type ValidatedStore = z.infer<typeof StoreSchema>;

// Parse and validate incoming store (from localStorage or backup file)
export function validateStoreData(raw: unknown): ValidatedStore {
  if (!raw || typeof raw !== "object") {
    return { name: "", days: {} };
  }

  // Prevent prototype pollution
  const cleanObj = JSON.parse(JSON.stringify(raw));

  const result = StoreSchema.safeParse(cleanObj);
  if (result.success) {
    return result.data;
  }

  console.warn("Data failed strict schema validation. Recovering safe subset:", result.error);

  // Partial recovery: extract name and valid days
  const recoveredName = typeof cleanObj.name === "string" ? sanitizeText(cleanObj.name, 50) : "";
  const recoveredDays: Record<string, Activity[]> = {};

  if (cleanObj.days && typeof cleanObj.days === "object") {
    for (const [dateKey, acts] of Object.entries(cleanObj.days)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey) && Array.isArray(acts)) {
        const validActs: Activity[] = [];
        for (const act of acts) {
          const actResult = ActivitySchema.safeParse(act);
          if (actResult.success) {
            validActs.push(actResult.data as Activity);
          }
        }
        if (validActs.length > 0) {
          recoveredDays[dateKey] = validActs;
        }
      }
    }
  }

  return { name: recoveredName, days: recoveredDays };
}

// Defensive LocalStorage write wrapper with QuotaExceededError protection
export function safeSetLocalStorage(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn("Storage write failed (QuotaExceeded or permission denied):", err);
    return false;
  }
}

// Defensive LocalStorage read wrapper
export function safeGetLocalStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn("Storage read failed:", err);
    return null;
  }
}
