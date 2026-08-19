import { useEffect, useState } from "react";
import { AppShell } from "../../../app/layout/AppShell";
import { PageHeader } from "../../../app/layout/PageHeader";
import { adminNavItems, employeeNavItems, managerNavItems } from "../../../app/nav";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/Table";
import { PlusIcon, SearchIcon } from "../../../components/ui/icons";
import { cn } from "../../../lib/utils";
import { useAuthStore } from "../../../stores/authStore";
import { useResources } from "../hooks";
import { ResourceCard } from "./ResourceCard";
import { ShareResourceModal } from "./ShareResourceModal";
import type { ResourceScope, ResourceStatus } from "../types";

const SCOPE_TABS: { value: ResourceScope | ""; label: string }[] = [
  { value: "", label: "Everything" },
  { value: "GLOBAL", label: "Whole org" },
  { value: "TEAM", label: "Team" },
  { value: "PROJECT", label: "Project" },
];

const STATUS_TABS: { value: ResourceStatus | ""; label: string }[] = [
  { value: "APPROVED", label: "Shared" },
  { value: "PENDING", label: "Pending" },
  { value: "REJECTED", label: "Declined" },
];

export function KnowledgeBasePage() {
  const role = useAuthStore((s) => s.user?.role);
  const navItems = role === "ADMIN" ? adminNavItems : role === "MANAGER" ? managerNavItems : employeeNavItems;

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<ResourceScope | "">("");
  const [status, setStatus] = useState<ResourceStatus | "">("APPROVED");
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const resources = useResources({
    search: search || undefined,
    scope: scope || undefined,
    status: status || undefined,
    pageSize: 50,
  });
  const items = resources.data?.items ?? [];

  return (
    <AppShell navItems={navItems}>
      <PageHeader
        crumbs={["Home", "Knowledge Base"]}
        title="Knowledge Base"
        actions={
          <Button size="sm" icon={<PlusIcon width={14} height={14} />} onClick={() => setIsShareOpen(true)}>
            Share resource
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="relative">
          <SearchIcon width={16} height={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search resources you have access to…"
            className="w-full rounded-2xl border border-black/10 bg-white py-2.5 pl-11 pr-4 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-full bg-black/5 p-1">
            {SCOPE_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setScope(tab.value)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  scope === tab.value ? "bg-ink text-white" : "text-ink-soft hover:bg-white/70",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="inline-flex flex-wrap items-center gap-1 rounded-full bg-black/5 p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatus(tab.value)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  status === tab.value ? "bg-ink text-white" : "text-ink-soft hover:bg-white/70",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {resources.isLoading ? (
          <p className="py-10 text-center text-sm text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <EmptyState
            message={
              search
                ? "No resources match your search."
                : status === "PENDING"
                  ? "Nothing waiting on approval."
                  : "No resources shared yet."
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </div>

      <ShareResourceModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
    </AppShell>
  );
}
