import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppShell } from "../../../app/layout/AppShell";
import { PageHeader } from "../../../app/layout/PageHeader";
import { adminNavItems } from "../../../app/nav";
import { Card, TintedCard } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { BuildingIcon, CopyIcon, ListChecksIcon, UsersIcon } from "../../../components/ui/icons";
import { formatDate } from "../../../lib/utils";
import { getApiErrorMessage } from "../../../lib/api";
import { useOrganization, useUpdateOrganization, useUsers } from "../hooks";

const schema = z.object({ name: z.string().min(2, "Organization name is required") });
type FormValues = z.infer<typeof schema>;

export function AdminOrgPage() {
  const org = useOrganization();
  const updateOrg = useUpdateOrganization();
  const managers = useUsers({ role: "MANAGER", pageSize: 1 });
  const employees = useUsers({ role: "EMPLOYEE", pageSize: 1 });
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (org.data) reset({ name: org.data.name });
  }, [org.data, reset]);

  const totalMembers = 1 + (managers.data?.pagination.total ?? 0) + (employees.data?.pagination.total ?? 0);

  const copyOrgId = () => {
    if (!org.data) return;
    navigator.clipboard.writeText(org.data.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AppShell navItems={adminNavItems}>
      <PageHeader crumbs={["Home", "Organization"]} title="Organization settings" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TintedCard
          tone="lavender"
          eyebrowIcon={<UsersIcon width={14} height={14} />}
          eyebrow="Total members"
          title={totalMembers}
        />
        <TintedCard
          tone="dark"
          eyebrowIcon={<BuildingIcon width={14} height={14} />}
          eyebrow="Managers"
          title={managers.data?.pagination.total ?? "—"}
        />
        <TintedCard
          tone="rose"
          eyebrowIcon={<ListChecksIcon width={14} height={14} />}
          eyebrow="Employees"
          title={employees.data?.pagination.total ?? "—"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold text-ink">Organization details</h2>
          <p className="mt-1 text-sm text-muted">Update the name shown across Traky.</p>

          <form
            className="mt-5 flex flex-col gap-4"
            onSubmit={handleSubmit((values) => updateOrg.mutate(values.name))}
          >
            <Input label="Organization name" error={errors.name?.message} {...register("name")} />

            {updateOrg.isError ? (
              <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
                {getApiErrorMessage(updateOrg.error, "Unable to update organization")}
              </p>
            ) : null}
            {updateOrg.isSuccess ? (
              <p className="rounded-2xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">Saved.</p>
            ) : null}

            <Button type="submit" className="w-full" isLoading={updateOrg.isPending}>
              Save changes
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-ink">Workspace info</h2>
          <p className="mt-1 text-sm text-muted">Reference details for this organization.</p>

          <dl className="mt-5 flex flex-col divide-y divide-black/5">
            <div className="flex items-center justify-between py-3 first:pt-0">
              <dt className="text-sm text-muted">Slug</dt>
              <dd className="text-sm font-medium text-ink">{org.data?.slug ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-sm text-muted">Created on</dt>
              <dd className="text-sm font-medium text-ink">{formatDate(org.data?.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between py-3 last:pb-0">
              <dt className="text-sm text-muted">Organization ID</dt>
              <dd>
                <button
                  type="button"
                  onClick={copyOrgId}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-2.5 py-1 text-xs font-medium text-ink-soft transition-colors hover:bg-black/[0.03]"
                  title={org.data?.id}
                >
                  <CopyIcon width={13} height={13} />
                  {copied ? "Copied!" : `${org.data?.id.slice(0, 8) ?? "—"}…`}
                </button>
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </AppShell>
  );
}
