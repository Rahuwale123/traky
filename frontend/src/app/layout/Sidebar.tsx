import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useLogout } from "../../features/auth/hooks";
import { Avatar } from "../../components/ui/Avatar";
import { LogOutIcon } from "../../components/ui/icons";
import { cn } from "../../lib/utils";

export interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
  end?: boolean;
}

export function Sidebar({ items }: { items: NavItem[] }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-black/5 px-4 py-6">
      <div className="flex items-center gap-2 px-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-sm font-bold text-white">
          T
        </span>
        <span className="text-lg font-extrabold tracking-tight text-ink">Traky</span>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors",
                isActive ? "bg-ink text-white" : "hover:bg-black/[0.04]",
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {user ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-black/5 px-3 py-3">
          <Avatar name={user.fullName} size={34} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{user.fullName}</p>
            <p className="truncate text-xs capitalize text-muted">{user.role.toLowerCase()}</p>
          </div>
          <button
            aria-label="Log out"
            onClick={() => logout.mutate()}
            className="rounded-full p-2 text-muted transition-colors hover:bg-black/5 hover:text-ink"
          >
            <LogOutIcon width={16} height={16} />
          </button>
        </div>
      ) : null}
    </aside>
  );
}
