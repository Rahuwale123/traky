import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { EmptyState, TBody, THead, Table, Td, Th, Tr } from "../../../components/ui/Table";
import { PlusIcon } from "../../../components/ui/icons";
import { getApiErrorMessage } from "../../../lib/api";
import { useCreateDesignation, useDesignations, useUpdateDesignation } from "../hooks";
import type { Designation } from "../types";

const schema = z.object({
  name: z.string().trim().min(2, "At least 2 characters"),
  category: z.string().trim().min(2, "At least 2 characters"),
});
type FormValues = z.infer<typeof schema>;

export function DesignationManager() {
  const designations = useDesignations({ includeInactive: true });
  const createDesignation = useCreateDesignation();
  const updateDesignation = useUpdateDesignation();

  const [editTarget, setEditTarget] = useState<Designation | "new" | null>(null);

  const isEditing = editTarget !== null && editTarget !== "new";
  const isOpen = editTarget !== null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isEditing) reset({ name: editTarget.name, category: editTarget.category });
    else if (editTarget === "new") reset({ name: "", category: "" });
  }, [editTarget, isEditing, reset]);

  const close = () => {
    setEditTarget(null);
    createDesignation.reset();
    updateDesignation.reset();
  };

  const onSubmit = (values: FormValues) => {
    if (isEditing) {
      updateDesignation.mutate({ id: editTarget.id, payload: values }, { onSuccess: close });
    } else {
      createDesignation.mutate(values, { onSuccess: close });
    }
  };

  const toggleActive = (d: Designation) => {
    updateDesignation.mutate({ id: d.id, payload: { isActive: !d.isActive } });
  };

  const items = designations.data ?? [];
  const mutation = isEditing ? updateDesignation : createDesignation;

  return (
    <Card className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink">Job titles</h2>
          <p className="mt-1 text-sm text-muted">
            Managers pick from this list when adding members — never free text. Platform defaults are shared and
            read-only; titles you add here are yours to edit or archive.
          </p>
        </div>
        <Button size="sm" icon={<PlusIcon width={14} height={14} />} onClick={() => setEditTarget("new")}>
          New job title
        </Button>
      </div>

      <div className="mt-5">
        <Table>
          <THead>
            <Tr>
              <Th>Name</Th>
              <Th>Category</Th>
              <Th>Source</Th>
              <Th>Status</Th>
              <Th></Th>
            </Tr>
          </THead>
          <TBody>
            {items.map((d) => {
              const isCustom = d.organizationId !== null;
              return (
                <Tr key={d.id}>
                  <Td className="font-semibold">{d.name}</Td>
                  <Td className="text-muted">{d.category}</Td>
                  <Td>
                    <Badge tone={isCustom ? "violet" : "neutral"}>{isCustom ? "Custom" : "Platform"}</Badge>
                  </Td>
                  <Td>
                    <Badge tone={d.isActive ? "lavender" : "neutral"}>{d.isActive ? "Active" : "Archived"}</Badge>
                  </Td>
                  <Td>
                    {isCustom ? (
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditTarget(d)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => toggleActive(d)}>
                          {d.isActive ? "Archive" : "Restore"}
                        </Button>
                      </div>
                    ) : null}
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
        {items.length === 0 ? <EmptyState message="No job titles yet." /> : null}
      </div>

      <Modal isOpen={isOpen} onClose={close} title={isEditing ? "Edit job title" : "New job title"}>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Title" placeholder="e.g. Sr Python Developer" error={errors.name?.message} {...register("name")} />
          <Input label="Category" placeholder="e.g. Engineering" error={errors.category?.message} {...register("category")} />

          {mutation.isError ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
              {getApiErrorMessage(mutation.error, "Unable to save job title")}
            </p>
          ) : null}

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" isLoading={mutation.isPending}>
              {isEditing ? "Save changes" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
