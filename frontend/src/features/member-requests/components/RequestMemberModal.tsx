import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "../../../components/ui/Modal";
import { Textarea } from "../../../components/ui/Textarea";
import { SearchableSelect } from "../../../components/ui/SearchableSelect";
import { Button } from "../../../components/ui/Button";
import { getApiErrorMessage } from "../../../lib/api";
import { useDesignations } from "../../admin/hooks";
import { useCreateMemberRequest } from "../hooks";

const schema = z.object({
  designationId: z.string().optional(),
  note: z.string().trim().min(1, "Tell the admin why you need this hire"),
});
type FormValues = z.infer<typeof schema>;

export function RequestMemberModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const designations = useDesignations();
  const createRequest = useCreateMemberRequest();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const close = () => {
    reset();
    createRequest.reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Request a new team member">
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((values) =>
          createRequest.mutate(
            { designationId: values.designationId || undefined, note: values.note },
            { onSuccess: close },
          ),
        )}
      >
        <Controller
          control={control}
          name="designationId"
          render={({ field }) => (
            <SearchableSelect
              label="Role (optional)"
              placeholder="Search job titles…"
              options={(designations.data ?? []).map((d) => ({ id: d.id, label: d.name, group: d.category }))}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Textarea
          label="Why do you need this hire?"
          placeholder="e.g. Team is overloaded on the Q3 roadmap, need a dedicated backend dev…"
          error={errors.note?.message}
          {...register("note")}
        />

        {createRequest.isError ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
            {getApiErrorMessage(createRequest.error, "Unable to submit request")}
          </p>
        ) : null}

        <Button type="submit" className="w-full" isLoading={createRequest.isPending}>
          Send request
        </Button>
      </form>
    </Modal>
  );
}
