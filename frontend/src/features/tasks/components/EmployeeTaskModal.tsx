import { useEffect, useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Select } from "../../../components/ui/Select";
import { useAuthStore } from "../../../stores/authStore";
import { useUpdateTaskStatus } from "../hooks";
import { taskStatusValues, taskStatusLabels } from "../constants";
import { CommentsPanel } from "./CommentsPanel";
import type { Task } from "../types";

export function EmployeeTaskModal({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const currentUser = useAuthStore((s) => s.user);
  const updateStatus = useUpdateTaskStatus("my-tasks");
  const [status, setStatus] = useState<Task["status"]>("TODO");

  useEffect(() => {
    if (task) setStatus(task.status);
  }, [task]);

  if (!task) return null;

  const authorNameById = new Map<string, string>();
  if (currentUser) authorNameById.set(currentUser.id, currentUser.fullName);

  return (
    <Modal isOpen={Boolean(task)} onClose={onClose} title={task.title}>
      <div className="flex flex-col gap-4">
        {task.description ? <p className="text-sm text-ink-soft">{task.description}</p> : null}

        <Select
          label="Status"
          value={status}
          onChange={(e) => {
            const value = e.target.value as Task["status"];
            setStatus(value);
            updateStatus.mutate({ id: task.id, status: value });
          }}
        >
          {taskStatusValues.map((s) => (
            <option key={s} value={s}>
              {taskStatusLabels[s]}
            </option>
          ))}
        </Select>

        <hr className="border-black/5" />

        <CommentsPanel taskId={task.id} authorNameById={authorNameById} />
      </div>
    </Modal>
  );
}
