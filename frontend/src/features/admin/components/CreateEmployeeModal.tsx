import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { SearchableSelect } from "../../../components/ui/SearchableSelect";
import { Button } from "../../../components/ui/Button";
import { getApiErrorMessage } from "../../../lib/api";
import { useCreateEmployee, useDesignations, useUsers } from "../hooks";

const schema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  managerId: z.string().optional(),
  designationId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function CreateEmployeeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const createEmployee = useCreateEmployee();
  const managers = useUsers({ role: "MANAGER", pageSize: 100 });
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
    createEmployee.reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="New employee">
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((values) =>
          createEmployee.mutate(
            { ...values, managerId: values.managerId || null, designationId: values.designationId || undefined },
            { onSuccess: close },
          ),
        )}
      >
        <Input label="Full name" placeholder="Ethan Employee" error={errors.fullName?.message} {...register("fullName")} />
        <Input label="Email" type="email" placeholder="employee@company.com" error={errors.email?.message} {...register("email")} />
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
        <Select label="Manager (optional)" defaultValue="" {...register("managerId")}>
          <option value="">Unassigned</option>
          {managers.data?.items.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName}
            </option>
          ))}
        </Select>

        {createEmployee.isError ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
            {getApiErrorMessage(createEmployee.error, "Unable to create employee")}
          </p>
        ) : null}

        <Button type="submit" className="w-full" isLoading={createEmployee.isPending}>
          Create employee
        </Button>
      </form>
    </Modal>
  );
}
