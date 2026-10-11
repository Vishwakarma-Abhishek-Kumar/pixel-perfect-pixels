/**
 * PWA Service Worker, Persistent Storage, and Mobile Installation Utilities
 */

export type StorageStatus = {
  persisted: boolean;
  supported: boolean;
  quota?: number | undefined;
  usage?: number | undefined;
};

// Request OS/Browser Persistent Storage to prevent mobile storage eviction
export async function requestPersistentStorage(): Promise<StorageStatus> {
  if (typeof window === "undefined" || !navigator.storage || !navigator.storage.persist) {
    return { persisted: false, supported: false };
  }

  try {
    let isPersisted = await navigator.storage.persisted();
    if (!isPersisted) {
      isPersisted = await navigator.storage.persist();
    }

    let quota: number | undefined;
    let usage: number | undefined;

    if (navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      quota = est.quota;
      usage = est.usage;
    }

    return {
      persisted: isPersisted,
      supported: true,
      quota,
      usage,
    };
  } catch (err) {
    console.warn("Could not request persistent storage:", err);
    return { persisted: false, supported: true };
  }
}

// Register Service Worker for offline capability
export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Auto-check for updates
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (installing) {
            installing.addEventListener("statechange", () => {
              if (installing.state === "installed" && navigator.serviceWorker.controller) {
                console.log("New Daybook update available.");
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn("Service worker registration failed:", err);
      });
  });
}

// Check if currently running as installed PWA standalone app
export function isAppInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari standalone flag
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// Backup / Export helper: Downloads JSON file to user's phone / device
export function exportDataBackup(data: unknown, filename = "daybook-backup.json"): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import helper: Reads uploaded JSON file
export async function readDataBackup(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        resolve(parsed);
      } catch (err) {
        reject(new Error("Invalid backup file. Could not parse JSON."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
}
