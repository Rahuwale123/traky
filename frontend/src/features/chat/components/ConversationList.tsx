import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { PlusIcon, UsersIcon } from "../../../components/ui/icons";
import { cn, relativeTime } from "../../../lib/utils";
import { useAuthStore } from "../../../stores/authStore";
import { useConversations } from "../hooks";
import type { ConversationSummary } from "../types";

interface ConversationListProps {
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

function previewText(conversation: ConversationSummary, selfId: string | undefined) {
  if (!conversation.lastMessage) return "No messages yet";
  const prefix = conversation.lastMessage.senderId === selfId ? "You: " : "";
  return `${prefix}${conversation.lastMessage.body}`;
}

export function ConversationList({ selectedId, onSelect, onNewChat }: ConversationListProps) {
  const conversations = useConversations();
  const selfId = useAuthStore((s) => s.user?.id);
  const items = conversations.data ?? [];

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-r border-black/10">
      <div className="flex items-center justify-between border-b border-black/10 px-4 py-4">
        <h2 className="text-base font-bold text-ink">Chats</h2>
        <Button size="sm" icon={<PlusIcon width={14} height={14} />} onClick={onNewChat}>
          New
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.isLoading ? (
          <p className="px-4 py-8 text-center text-sm text-muted">Loading chats…</p>
        ) : items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium text-ink-soft">No chats yet</p>
            <p className="mt-1 text-xs text-muted">Start a direct message or create a group.</p>
          </div>
        ) : (
          items.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={cn(
                "flex w-full items-center gap-3 border-b border-black/[0.04] px-4 py-3.5 text-left transition-colors hover:bg-black/[0.03]",
                selectedId === conversation.id && "bg-accent/[0.06]",
              )}
            >
              {conversation.type === "GROUP" ? (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/90 text-white">
                  <UsersIcon width={16} height={16} />
                </span>
              ) : (
                <Avatar name={conversation.name} size={32} />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-ink">{conversation.name}</p>
                  {conversation.lastMessage ? (
                    <span className="shrink-0 text-[11px] text-muted">{relativeTime(conversation.lastMessage.createdAt)}</span>
                  ) : null}
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-muted">{previewText(conversation, selfId)}</p>
                  {conversation.unreadCount > 0 ? (
                    <span className="flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                      {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
