import { useEffect, useRef, useState } from "react";
import { BellIcon } from "../../../components/ui/icons";
import { cn, relativeTime } from "../../../lib/utils";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, useUnreadCount } from "../hooks";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unread = useUnreadCount();
  const list = useNotifications({ pageSize: 10 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = unread.data ?? 0;
  const items = list.data?.items ?? [];

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Notifications"
        className="relative rounded-full p-2.5 text-muted transition-colors hover:bg-black/5 hover:text-ink"
      >
        <BellIcon width={19} height={19} />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-3xl border border-black/10 bg-white p-2 shadow-panel">
          <div className="flex items-center justify-between px-3 py-2">
            <h3 className="text-sm font-bold text-ink">Notifications</h3>
            {unreadCount > 0 ? (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs font-medium text-accent hover:text-accent-hover"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.readAt) markRead.mutate(n.id);
                }}
                className={cn(
                  "block w-full rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-black/[0.03]",
                  !n.readAt && "bg-accent/[0.04]",
                )}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", !n.readAt ? "bg-accent" : "bg-transparent")}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{n.title}</p>
                    {n.body ? <p className="mt-0.5 line-clamp-2 text-xs text-muted">{n.body}</p> : null}
                    <p className="mt-1 text-[11px] text-muted">{relativeTime(n.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))}
            {items.length === 0 ? <p className="px-3 py-8 text-center text-sm text-muted">No notifications yet.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
