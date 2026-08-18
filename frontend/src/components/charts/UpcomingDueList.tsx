import { Badge } from "../ui/Badge";
import { formatDate } from "../../lib/utils";
import type { Task } from "../../features/tasks/types";

function isOverdue(dueDate: string) {
  return dueDate < new Date().toISOString().slice(0, 10);
}

export function UpcomingDueList({ tasks }: { tasks: Task[] }) {
  const upcoming = tasks
    .filter((t) => t.dueDate && t.status !== "DONE")
    .sort((a, b) => (a.dueDate as string).localeCompare(b.dueDate as string))
    .slice(0, 5);

  if (upcoming.length === 0) {
    return <p className="text-sm text-muted">Nothing due soon.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-black/5">
      {upcoming.map((task) => (
        <li key={task.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <span className="truncate text-sm font-medium text-ink">{task.title}</span>
          <Badge tone={isOverdue(task.dueDate as string) ? "rose" : "neutral"} className="shrink-0">
            {formatDate(task.dueDate)}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
