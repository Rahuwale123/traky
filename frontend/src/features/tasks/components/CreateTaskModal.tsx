import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { getApiErrorMessage } from "../../../lib/api";
import { useMyTeam } from "../../admin/hooks";
import { useCreateTask } from "../hooks";
import { taskPriorityValues } from "../constants";

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(taskPriorityValues),
  dueDate: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function CreateTaskModal({
  isOpen,
  onClose,
  projectId,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}) {
  const createTask = useCreateTask();
  const team = useMyTeam({ pageSize: 100 });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { priority: "MEDIUM" } });

  const close = () => {
    reset();
    createTask.reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="New task">
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((values) =>
          createTask.mutate(
            {
              projectId,
              title: values.title,
              description: values.description,
              assigneeId: values.assigneeId || null,
              priority: values.priority,
              dueDate: values.dueDate || null,
            },
            { onSuccess: close },
          ),
        )}
      >
        <Input label="Title" placeholder="Design homepage" error={errors.title?.message} {...register("title")} />
        <Input label="Description (optional)" placeholder="Details" {...register("description")} />
        <Select label="Assignee" defaultValue="" {...register("assigneeId")}>
          <option value="">Unassigned</option>
          {team.data?.items.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Priority" {...register("priority")}>
            {taskPriorityValues.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <Input label="Due date (optional)" type="date" {...register("dueDate")} />
        </div>

        {createTask.isError ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
            {getApiErrorMessage(createTask.error, "Unable to create task")}
          </p>
        ) : null}

        <Button type="submit" className="w-full" isLoading={createTask.isPending}>
          Create task
        </Button>
      </form>
    </Modal>
  );
}
