import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, User } from "lucide-react";

type Props = {
  open: boolean;
  initialName?: string;
  onSave: (name: string) => void;
  onClose: () => void;
};

export function WelcomeNameModal({ open, initialName = "", onSave, onClose }: Props) {
  const [nameInput, setNameInput] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return undefined;

    setNameInput(initialName);
    // Ensure focus on next animation frame
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [open, initialName]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = nameInput.trim();
    if (trimmed) {
      onSave(trimmed);
      onClose();
    }
  };

  const handleSkip = () => {
    onSave("friend");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-overlay backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-[2.5rem] border border-border/80 bg-card p-7 shadow-lift sm:p-9"
          >
            {/* Ambient background glow */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent opacity-20 blur-3xl" />

            {/* Icon Header */}
            <div className="relative mb-6 flex items-center justify-center">
              <motion.div
                initial={{ rotate: -20, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/15 text-3xl shadow-soft"
              >
                👋
              </motion.div>
            </div>

            {/* Title & Description */}
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-accent">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Welcome to Daybook</span>
              </div>
              <h2 className="mt-3 font-display text-2xl font-medium sm:text-3xl text-foreground">
                What should we call you?
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Add your name to personalize your daily board and morning greeting.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground">
                  <User className="h-4 w-4" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  maxLength={30}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full rounded-2xl border border-border bg-muted/40 py-3.5 pl-11 pr-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 transition"
                />
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={!nameInput.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3.5 text-sm font-bold text-accent-foreground shadow-soft transition hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                {!initialName && (
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="w-full py-2 text-center text-xs font-medium text-muted-foreground hover:text-foreground transition"
                  >
                    Skip for now
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
