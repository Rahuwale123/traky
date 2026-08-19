import { useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { SearchableSelect } from "../../../components/ui/SearchableSelect";
import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/utils";
import { getApiErrorMessage } from "../../../lib/api";
import { useAuthStore } from "../../../stores/authStore";
import { useUsers } from "../../admin/hooks";
import { useProjects } from "../../projects/hooks";
import { useCreateResource } from "../hooks";
import type { ResourceScope } from "../types";

interface ShareResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SCOPE_OPTIONS: { value: ResourceScope; label: string; hint: string }[] = [
  { value: "GLOBAL", label: "Whole org", hint: "Visible to everyone in the organization" },
  { value: "TEAM", label: "A team", hint: "Visible to a manager and their reports" },
  { value: "PROJECT", label: "A project", hint: "Visible to everyone who can see that project" },
];

export function ShareResourceModal({ isOpen, onClose }: ShareResourceModalProps) {
  const role = useAuthStore((s) => s.user?.role);
  const createResource = useCreateResource();

  const [scope, setScope] = useState<ResourceScope>("GLOBAL");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [teamManagerId, setTeamManagerId] = useState<string | undefined>();
  const [projectId, setProjectId] = useState<string | undefined>();

  const managers = useUsers({ role: "MANAGER", pageSize: 100 }, { enabled: role === "ADMIN" && scope === "TEAM" });
  const projects = useProjects({ pageSize: 100 });

  const close = () => {
    setScope("GLOBAL");
    setTitle("");
    setUrl("");
    setDescription("");
    setTeamManagerId(undefined);
    setProjectId(undefined);
    createResource.reset();
    onClose();
  };

  const canSubmit =
    title.trim().length > 0 &&
    url.trim().length > 0 &&
    (scope !== "PROJECT" || !!projectId) &&
    (scope !== "TEAM" || role !== "ADMIN" || !!teamManagerId);

  const submit = () => {
    const base = { title: title.trim(), url: url.trim(), description: description.trim() || undefined };
    if (scope === "GLOBAL") {
      createResource.mutate({ scope, ...base }, { onSuccess: close });
    } else if (scope === "TEAM") {
      createResource.mutate({ scope, ...base, teamManagerId: role === "ADMIN" ? teamManagerId : undefined }, { onSuccess: close });
    } else {
      if (!projectId) return;
      createResource.mutate({ scope, ...base, projectId }, { onSuccess: close });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Share a resource">
      <div className="flex flex-col gap-4">
        <Input label="Title" placeholder="e.g. Onboarding guide" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Link" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Textarea
          label="Description (optional)"
          placeholder="What is this and why it's useful…"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div>
          <label className="text-sm font-medium text-ink-soft">Share with</label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {SCOPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setScope(option.value)}
                className={cn(
                  "rounded-2xl border px-3 py-2.5 text-left text-xs transition-colors",
                  scope === option.value ? "border-accent bg-accent/[0.06] text-ink" : "border-black/10 text-muted hover:bg-black/[0.03]",
                )}
              >
                <span className="block text-sm font-semibold text-ink">{option.label}</span>
                <span className="mt-0.5 block text-[11px] text-muted">{option.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {scope === "TEAM" && role === "ADMIN" ? (
          <SearchableSelect
            label="Which manager's team?"
            placeholder="Search managers…"
            options={(managers.data?.items ?? []).map((m) => ({ id: m.id, label: m.fullName }))}
            value={teamManagerId}
            onChange={setTeamManagerId}
          />
        ) : null}
        {scope === "TEAM" && role !== "ADMIN" ? <p className="text-xs text-muted">Shared with your own team.</p> : null}

        {scope === "PROJECT" ? (
          <SearchableSelect
            label="Which project?"
            placeholder="Search projects…"
            options={(projects.data?.items ?? []).map((p) => ({ id: p.id, label: p.name }))}
            value={projectId}
            onChange={setProjectId}
            emptyMessage="No projects available"
          />
        ) : null}

        {role === "EMPLOYEE" ? (
          <p className="rounded-2xl bg-black/[0.03] px-4 py-2.5 text-xs text-muted">
            Your manager will need to approve this before it's visible to others.
          </p>
        ) : null}

        {createResource.isError ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
            {getApiErrorMessage(createResource.error, "Unable to share resource")}
          </p>
        ) : null}

        <div className="mt-1 flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit} isLoading={createResource.isPending}>
            Share
          </Button>
        </div>
      </div>
    </Modal>
  );
}
