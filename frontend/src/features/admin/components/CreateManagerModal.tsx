import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { SearchableSelect } from "../../../components/ui/SearchableSelect";
import { Button } from "../../../components/ui/Button";
import { getApiErrorMessage } from "../../../lib/api";
import { useCreateManager, useDesignations } from "../hooks";

const schema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  designationId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function CreateManagerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const createManager = useCreateManager();
  const designations = useDesignations();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const close = () => {
    reset();
    createManager.reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="New manager">
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((values) =>
          createManager.mutate(
            { ...values, designationId: values.designationId || undefined },
            { onSuccess: close },
          ),
        )}
      >
        <Input label="Full name" placeholder="Marcus Manager" error={errors.fullName?.message} {...register("fullName")} />
        <Input label="Email" type="email" placeholder="manager@company.com" error={errors.email?.message} {...register("email")} />
        <Input label="Temporary password" type="password" placeholder="At least 8 characters" error={errors.password?.message} {...register("password")} />
        <Controller
          control={control}
          name="designationId"
          render={({ field }) => (
            <SearchableSelect
              label="Designation (optional)"
              placeholder="Search job titles…"
              options={(designations.data ?? []).map((d) => ({ id: d.id, label: d.name, group: d.category }))}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />

        {createManager.isError ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
            {getApiErrorMessage(createManager.error, "Unable to create manager")}
          </p>
        ) : null}

        <Button type="submit" className="w-full" isLoading={createManager.isPending}>
          Create manager
        </Button>
      </form>
    </Modal>
  );
}
