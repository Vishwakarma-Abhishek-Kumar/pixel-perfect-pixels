import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  Download,
  Upload,
  ShieldCheck,
  Check,
  X,
  Share2,
  HardDrive,
  Info,
  Sparkles,
} from "lucide-react";
import {
  exportDataBackup,
  readDataBackup,
  requestPersistentStorage,
  isAppInstalled,
  type StorageStatus,
} from "@/lib/pwa";
import type { Tracker } from "@/hooks/use-tracker";

type Props = {
  open: boolean;
  onClose: () => void;
  tracker: Tracker;
  date: string;
};

// Interface for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function StorageAndInstallModal({ open, onClose, tracker, date }: Props) {
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check installation and persistent storage status
  useEffect(() => {
    if (typeof window === "undefined") return;

    setInstalled(isAppInstalled());
    requestPersistentStorage().then(setStorageStatus);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, [open]);

  // Handle Android/Chrome PWA install
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setFeedback("Daybook installed successfully!");
      }
      setDeferredPrompt(null);
    }
  };

  // Export current data backup
  const handleExport = () => {
    try {
      const store = tracker.getStore();
      const todayStr = date || new Date().toISOString().slice(0, 10);
      exportDataBackup(store, `daybook-backup-${todayStr}.json`);
      setFeedback("Backup downloaded to your device files!");
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback("Failed to export backup.");
    }
  };

  // Import backup file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await readDataBackup(file);
      tracker.restoreStore(data);
      setFeedback("Backup verified & restored safely!");
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback((err as Error).message || "Failed to restore backup.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-overlay backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-[2rem] border border-border/80 bg-card p-6 shadow-lift sm:p-8"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-medium sm:text-2xl">
                    Install & Phone Storage
                  </h3>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Offline access and persistent device data
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Notification alert */}
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2 rounded-xl bg-accent/15 px-3.5 py-2.5 text-xs font-semibold text-accent"
              >
                <Check className="h-4 w-4 shrink-0" />
                <span>{feedback}</span>
              </motion.div>
            )}

            <div className="mt-6 space-y-5">
              {/* Section 1: Mobile Installation */}
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <h4 className="text-sm font-semibold">Install on Your Phone</h4>
                  </div>
                  {installed && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <Check className="h-3 w-3" /> Installed
                    </span>
                  )}
                </div>

                {installed ? (
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Daybook is currently running as an installed standalone app on this device.
                  </p>
                ) : deferredPrompt ? (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Add Daybook to your home screen for instant fullscreen access with zero
                      browser bars.
                    </p>
                    <button
                      onClick={handleInstallClick}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-accent-foreground shadow-soft transition hover:opacity-95"
                    >
                      <Download className="h-4 w-4" /> Install App to Home Screen
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2 text-xs text-muted-foreground leading-relaxed">
                    <p>To install directly to your phone’s home screen:</p>
                    <div className="rounded-xl border border-border/50 bg-card p-3 space-y-1.5">
                      <p className="font-semibold text-foreground">🍎 On iPhone / iPad (Safari):</p>
                      <p>
                        Tap the <b>Share button</b> (
                        <Share2 className="inline h-3 w-3 text-accent" />) in Safari, scroll down
                        and tap <b>"Add to Home Screen"</b>.
                      </p>
                      <p className="mt-2 font-semibold text-foreground">
                        🤖 On Android (Chrome / Edge):
                      </p>
                      <p>
                        Tap the browser menu (<b>⋮</b>) in the top-right corner and select{" "}
                        <b>"Install app"</b> or <b>"Add to Home screen"</b>.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Persistent Storage Status */}
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-sm font-semibold">Local Phone Storage</h4>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {storageStatus?.persisted ? "Protected" : "Active"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Your boards and checklist data are saved directly on this device. Storage
                  persistence is activated to prevent your phone’s operating system from
                  automatically deleting your data during disk cleanup.
                </p>
                <div className="mt-2.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <HardDrive className="h-3.5 w-3.5 text-muted-foreground/80" />
                  <span>Saves automatically in real-time until you explicitly delete it.</span>
                </div>
              </div>

              {/* Section 3: Data Backup & Restore */}
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-5">
                <div className="flex items-center gap-2.5">
                  <Info className="h-4 w-4 text-accent" />
                  <h4 className="text-sm font-semibold">Data Backup & Restore</h4>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Save a personal copy to your phone's files or transfer to another device anytime.
                </p>

                <div className="mt-3.5 flex flex-wrap gap-2.5">
                  <button
                    onClick={handleExport}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-foreground transition hover:bg-muted"
                  >
                    <Download className="h-3.5 w-3.5 text-accent" /> Export Backup (.json)
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-foreground transition hover:bg-muted"
                  >
                    <Upload className="h-3.5 w-3.5 text-accent" /> Restore Backup (.json)
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
