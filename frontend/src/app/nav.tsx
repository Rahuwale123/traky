import {
  BookIcon,
  BuildingIcon,
  ChatIcon,
  ClockIcon,
  HistoryIcon,
  HomeIcon,
  LayersIcon,
  ListChecksIcon,
  NoteIcon,
  UserPlusIcon,
  UsersIcon,
} from "../components/ui/icons";
import type { NavItem } from "./layout/Sidebar";

export const adminNavItems: NavItem[] = [
  { label: "Dashboard", to: "/admin", icon: <HomeIcon />, end: true },
  { label: "Team", to: "/admin/team", icon: <UsersIcon /> },
  { label: "Attendance", to: "/admin/attendance", icon: <ClockIcon /> },
  { label: "Daily Updates", to: "/admin/daily-updates", icon: <NoteIcon /> },
  { label: "Chat", to: "/admin/chat", icon: <ChatIcon />, badge: "chat" },
  { label: "Knowledge Base", to: "/admin/knowledge", icon: <BookIcon /> },
  { label: "Requests", to: "/admin/member-requests", icon: <UserPlusIcon /> },
  { label: "Activity Log", to: "/admin/activity-log", icon: <HistoryIcon /> },
  { label: "Organization", to: "/admin/organization", icon: <BuildingIcon /> },
];

export const managerNavItems: NavItem[] = [
  { label: "Dashboard", to: "/manager", icon: <HomeIcon />, end: true },
  { label: "Projects", to: "/manager/projects", icon: <LayersIcon /> },
  { label: "My Team", to: "/manager/team", icon: <UsersIcon /> },
  { label: "Attendance", to: "/manager/attendance", icon: <ClockIcon /> },
  { label: "Daily Updates", to: "/manager/daily-updates", icon: <NoteIcon /> },
  { label: "Chat", to: "/manager/chat", icon: <ChatIcon />, badge: "chat" },
  { label: "Knowledge Base", to: "/manager/knowledge", icon: <BookIcon /> },
  { label: "Requests", to: "/manager/member-requests", icon: <UserPlusIcon /> },
];

export const employeeNavItems: NavItem[] = [
  { label: "Dashboard", to: "/employee", icon: <HomeIcon />, end: true },
  { label: "My Tasks", to: "/employee/tasks", icon: <ListChecksIcon /> },
  { label: "My Updates", to: "/employee/updates", icon: <NoteIcon /> },
  { label: "Chat", to: "/employee/chat", icon: <ChatIcon />, badge: "chat" },
  { label: "Knowledge Base", to: "/employee/knowledge", icon: <BookIcon /> },
];
