import type { Activity } from "./types";

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  USER_CREATED: "Member added",
  USER_DEACTIVATED: "Member deactivated",
  USER_REACTIVATED: "Member reactivated",
  USER_DESIGNATION_CHANGED: "Job title changed",
  USER_MANAGER_ASSIGNED: "Manager assigned",
  PROJECT_CREATED: "Project created",
  PROJECT_STATUS_CHANGED: "Project status changed",
  PROJECT_DELETED: "Project deleted",
  TASK_CREATED: "Task created",
  TASK_STATUS_CHANGED: "Task status changed",
  TASK_ASSIGNED: "Task assigned",
  TASK_DELETED: "Task deleted",
  MEMBER_REQUEST_CREATED: "Member request submitted",
  MEMBER_REQUEST_RESPONDED: "Member request responded",
  DESIGNATION_CREATED: "Job title created",
  DESIGNATION_UPDATED: "Job title updated",
  ORGANIZATION_UPDATED: "Organization settings updated",
};

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  user: "Team",
  project: "Projects",
  task: "Tasks",
  member_request: "Requests",
  designation: "Job titles",
  organization: "Organization",
};

export function describeActivity(activity: Activity): string {
  const m = (activity.metadata ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);

  switch (activity.type) {
    case "USER_CREATED":
      return `${activity.actorName} added ${str(m.fullName) ?? "a new member"} as ${str(m.role)?.toLowerCase() ?? "a member"}`;
    case "USER_DEACTIVATED":
      return `${activity.actorName} deactivated ${str(m.fullName) ?? "a member"}`;
    case "USER_REACTIVATED":
      return `${activity.actorName} reactivated ${str(m.fullName) ?? "a member"}`;
    case "USER_DESIGNATION_CHANGED":
      return `${activity.actorName} changed ${str(m.fullName) ?? "a member"}'s job title`;
    case "USER_MANAGER_ASSIGNED":
      return `${activity.actorName} assigned ${str(m.fullName) ?? "a member"} to ${str(m.managerName) ?? "a manager"}`;
    case "PROJECT_CREATED":
      return `${activity.actorName} created project "${str(m.name) ?? "Untitled"}"`;
    case "PROJECT_STATUS_CHANGED":
      return `${activity.actorName} moved project "${str(m.name) ?? ""}" from ${str(m.from) ?? "?"} to ${str(m.to) ?? "?"}`;
    case "PROJECT_DELETED":
      return `${activity.actorName} deleted project "${str(m.name) ?? ""}"`;
    case "TASK_CREATED":
      return `${activity.actorName} created task "${str(m.title) ?? "Untitled"}"`;
    case "TASK_STATUS_CHANGED":
      return `${activity.actorName} moved task "${str(m.title) ?? ""}" from ${str(m.from) ?? "?"} to ${str(m.to) ?? "?"}`;
    case "TASK_ASSIGNED":
      return `${activity.actorName} assigned task "${str(m.title) ?? ""}"`;
    case "TASK_DELETED":
      return `${activity.actorName} deleted task "${str(m.title) ?? ""}"`;
    case "MEMBER_REQUEST_CREATED":
      return `${activity.actorName} requested a new ${str(m.designationName) ?? "team member"}`;
    case "MEMBER_REQUEST_RESPONDED":
      return `${activity.actorName} ${str(m.status) === "APPROVED" ? "approved" : "declined"} a member request`;
    case "DESIGNATION_CREATED":
      return `${activity.actorName} created job title "${str(m.name) ?? ""}"`;
    case "DESIGNATION_UPDATED":
      return `${activity.actorName} updated job title "${str(m.name) ?? ""}"`;
    case "ORGANIZATION_UPDATED":
      return `${activity.actorName} updated organization settings`;
    default:
      return `${activity.actorName} performed ${activity.type}`;
  }
}
