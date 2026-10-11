import { useState } from "react";
import { Plus } from "lucide-react";

export function AddTaskInput({ onAdd }: { onAdd: (title: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const submit = () => {
    const v = value.trim();
    if (v) onAdd(v);
    setValue("");
  };

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-xl px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-tint hover:text-theme"
      >
        <Plus className="h-4 w-4" /> Add task
      </button>
    );

  return (
    <div className="mt-1 flex items-center gap-2 rounded-xl bg-card p-1.5 ring-1 ring-border focus-within:ring-theme">
      <input
        autoFocus
        value={value}
        placeholder="What needs doing?"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") {
            setValue("");
            setOpen(false);
          }
        }}
        onBlur={() => {
          if (!value.trim()) setOpen(false);
        }}
        className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-[15px] outline-none placeholder:text-muted-foreground/70"
      />
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={submit}
        className="rounded-lg bg-theme px-3 py-1.5 text-sm font-semibold text-card"
      >
        Add
      </button>
    </div>
  );
}
