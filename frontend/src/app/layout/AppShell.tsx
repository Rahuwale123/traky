import type { ReactNode } from "react";
import { Sidebar, type NavItem } from "./Sidebar";
import { NotificationBell } from "../../features/notifications/components/NotificationBell";

interface AppShellProps {
  navItems: NavItem[];
  children: ReactNode;
}

export function AppShell({ navItems, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-shell p-4 md:p-8">
      <div className="mx-auto flex h-[calc(100vh-2rem)] max-w-[1400px] overflow-hidden rounded-[2rem] bg-white shadow-panel md:h-[calc(100vh-4rem)]">
        <Sidebar items={navItems} />
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
          <div className="mb-2 flex justify-end">
            <NotificationBell />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
