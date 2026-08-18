import { useEffect, useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { useAuthStore } from "../../../stores/authStore";
import { useMyTeam } from "../../admin/hooks";
import { useDeleteTask, useUpdateTask } from "../hooks";
import { taskPriorityValues, taskStatusValues, taskStatusLabels } from "../constants";
import { CommentsPanel } from "./CommentsPanel";
import type { Task } from "../types";

export function TaskDetailModal({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const currentUser = useAuthStore((s) => s.user);
  const team = useMyTeam({ pageSize: 100 });
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("MEDIUM");
  const [status, setStatus] = useState<Task["status"]>("TODO");

  useEffect(() => {
    if (task) {
      setAssigneeId(task.assigneeId ?? "");
      setPriority(task.priority);
      setStatus(task.status);
    }
  }, [task]);

  if (!task) return null;

  const authorNameById = new Map<string, string>();
  if (currentUser) authorNameById.set(currentUser.id, currentUser.fullName);
  team.data?.items.forEach((m) => authorNameById.set(m.id, m.fullName));

  return (
    <Modal isOpen={Boolean(task)} onClose={onClose} title={task.title}>
      <div className="flex flex-col gap-4">
        {task.description ? <p className="text-sm text-ink-soft">{task.description}</p> : null}

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Status"
            value={status}
            onChange={(e) => {
              const value = e.target.value as Task["status"];
              setStatus(value);
              updateTask.mutate({ id: task.id, payload: { status: value } });
            }}
          >
            {taskStatusValues.map((s) => (
              <option key={s} value={s}>
                {taskStatusLabels[s]}
              </option>
            ))}
          </Select>
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => {
              const value = e.target.value as Task["priority"];
              setPriority(value);
              updateTask.mutate({ id: task.id, payload: { priority: value } });
            }}
          >
            {taskPriorityValues.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>

        <Select
          label="Assignee"
          value={assigneeId}
          onChange={(e) => {
            const value = e.target.value;
            setAssigneeId(value);
            updateTask.mutate({ id: task.id, payload: { assigneeId: value || null } });
          }}
        >
          <option value="">Unassigned</option>
          {team.data?.items.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName}
            </option>
          ))}
        </Select>

        <hr className="border-black/5" />

        <CommentsPanel taskId={task.id} authorNameById={authorNameById} />

        <div className="flex justify-end">
          <Button
            variant="danger"
            size="sm"
            isLoading={deleteTask.isPending}
            onClick={() => deleteTask.mutate(task.id, { onSuccess: onClose })}
          >
            Delete task
          </Button>
        </div>
      </div>
    </Modal>
  );
}
