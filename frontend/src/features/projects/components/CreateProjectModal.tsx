import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { getApiErrorMessage } from "../../../lib/api";
import { useCreateProject } from "../hooks";

const schema = z.object({
  name: z.string().min(2, "Project name is required"),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function CreateProjectModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const createProject = useCreateProject();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const close = () => {
    reset();
    createProject.reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="New project">
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((values) => createProject.mutate(values, { onSuccess: close }))}
      >
        <Input label="Project name" placeholder="Website Revamp" error={errors.name?.message} {...register("name")} />
        <Input label="Description (optional)" placeholder="Short summary" {...register("description")} />

        {createProject.isError ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
            {getApiErrorMessage(createProject.error, "Unable to create project")}
          </p>
        ) : null}

        <Button type="submit" className="w-full" isLoading={createProject.isPending}>
          Create project
        </Button>
      </form>
    </Modal>
  );
}
