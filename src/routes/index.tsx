import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/tracker/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Daybook — Your daily activity board" },
      { name: "description", content: "Plan your day with beautiful activity cards and checklists. Track progress, day by day." },
      { property: "og:title", content: "Daybook — Your daily activity board" },
      { property: "og:description", content: "A Pinterest-inspired board for daily rituals, tasks and habits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});
