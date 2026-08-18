import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { formatDate } from "../../../lib/utils";
import type { Task, TaskPriority } from "../types";
import type { OrgUser } from "../../admin/types";

const priorityTone: Record<TaskPriority, "lavender" | "rose" | "violet" | "neutral"> = {
  LOW: "neutral",
  MEDIUM: "lavender",
  HIGH: "rose",
  URGENT: "violet",
};

interface TaskCardProps {
  task: Task;
  assignee?: OrgUser;
  showAssignee?: boolean;
  onClick: () => void;
  draggable?: boolean;
  onDragStart?: () => void;
}

export function TaskCard({ task, assignee, showAssignee = true, onClick, draggable, onDragStart }: TaskCardProps) {
  return (
    <button
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      className="w-full cursor-pointer rounded-2xl border border-black/5 bg-white p-4 text-left shadow-soft transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{task.title}</p>
        <Badge tone={priorityTone[task.priority]} className="shrink-0">
          {task.priority}
        </Badge>
      </div>
      {showAssignee || task.dueDate ? (
        <div className="mt-3 flex items-center justify-between">
          {showAssignee ? (
            assignee ? (
              <span className="flex items-center gap-2 text-xs text-muted">
                <Avatar name={assignee.fullName} size={22} />
                {assignee.fullName}
              </span>
            ) : (
              <span className="text-xs text-muted">Unassigned</span>
            )
          ) : (
            <span />
          )}
          {task.dueDate ? <span className="text-xs text-muted">{formatDate(task.dueDate)}</span> : null}
        </div>
      ) : null}
    </button>
  );
}
