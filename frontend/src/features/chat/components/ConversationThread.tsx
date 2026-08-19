import { useEffect, useRef, useState } from "react";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { Textarea } from "../../../components/ui/Textarea";
import { SearchableSelect } from "../../../components/ui/SearchableSelect";
import { PlusIcon, UsersIcon } from "../../../components/ui/icons";
import { cn, formatTime } from "../../../lib/utils";
import { useAuthStore } from "../../../stores/authStore";
import {
  useAddParticipants,
  useChatContacts,
  useConversation,
  useLeaveConversation,
  useMarkConversationRead,
  useMessages,
  useSendMessage,
} from "../hooks";

interface ConversationThreadProps {
  conversationId: string;
  onLeft: () => void;
}

export function ConversationThread({ conversationId, onLeft }: ConversationThreadProps) {
  const selfId = useAuthStore((s) => s.user?.id);
  const conversation = useConversation(conversationId);
  const messages = useMessages(conversationId, { pageSize: 50 });
  const sendMessage = useSendMessage(conversationId);
  const markRead = useMarkConversationRead();
  const leaveConversation = useLeaveConversation();

  const [draft, setDraft] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const items = messages.data?.items ?? [];

  useEffect(() => {
    markRead.mutate(conversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, items.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [items.length, conversationId]);

  const convo = conversation.data;
  const title = convo ? (convo.type === "GROUP" ? convo.name : (convo.participants[0]?.fullName ?? "Chat")) : "";

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    sendMessage.mutate(body);
  };

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
        <div className="flex items-center gap-3">
          {convo?.type === "GROUP" ? (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/90 text-white">
              <UsersIcon width={17} height={17} />
            </span>
          ) : (
            <Avatar name={title || "?"} size={36} />
          )}
          <div>
            <p className="text-sm font-bold text-ink">{title}</p>
            {convo?.type === "GROUP" ? (
              <p className="text-xs text-muted">{convo.participants.length} members</p>
            ) : null}
          </div>
        </div>

        {convo?.type === "GROUP" ? (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<PlusIcon width={13} height={13} />} onClick={() => setIsAddingMember((v) => !v)}>
              Add
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => leaveConversation.mutate(conversationId, { onSuccess: onLeft })}
            >
              Leave
            </Button>
          </div>
        ) : null}
      </div>

      {isAddingMember && convo ? (
        <AddMemberBar conversationId={conversationId} existingIds={convo.participants.map((p) => p.id)} onDone={() => setIsAddingMember(false)} />
      ) : null}

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {messages.isLoading ? (
          <p className="py-8 text-center text-sm text-muted">Loading messages…</p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No messages yet. Say hello!</p>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((message, idx) => {
              const isSelf = message.senderId === selfId;
              const sender = convo?.participants.find((p) => p.id === message.senderId);
              const showSender = convo?.type === "GROUP" && !isSelf && items[idx - 1]?.senderId !== message.senderId;
              return (
                <div key={message.id} className={cn("flex flex-col", isSelf ? "items-end" : "items-start")}>
                  {showSender ? <p className="mb-1 px-1 text-[11px] font-semibold text-muted">{sender?.fullName ?? "Unknown"}</p> : null}
                  <div
                    className={cn(
                      "max-w-[70%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm",
                      isSelf ? "bg-accent text-white" : "bg-black/[0.05] text-ink",
                    )}
                  >
                    {message.body}
                  </div>
                  <span className="mt-1 px-1 text-[10px] text-muted">{formatTime(message.createdAt)}</span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="flex items-end gap-3 border-t border-black/10 px-6 py-4">
        <div className="flex-1">
          <Textarea
            rows={1}
            value={draft}
            placeholder="Write a message…"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            className="max-h-32"
          />
        </div>
        <Button onClick={submit} disabled={!draft.trim()} isLoading={sendMessage.isPending}>
          Send
        </Button>
      </div>
    </div>
  );
}

function AddMemberBar({ conversationId, existingIds, onDone }: { conversationId: string; existingIds: string[]; onDone: () => void }) {
  const contacts = useChatContacts();
  const addParticipants = useAddParticipants(conversationId);
  const [pick, setPick] = useState<string | undefined>();

  const options = (contacts.data ?? []).filter((c) => !existingIds.includes(c.id)).map((c) => ({ id: c.id, label: c.fullName, group: c.role }));

  return (
    <div className="flex items-center gap-3 border-b border-black/10 bg-black/[0.02] px-6 py-3">
      <div className="w-72">
        <SearchableSelect
          placeholder="Search teammates to add…"
          options={options}
          value={pick}
          onChange={(id) => {
            if (id) {
              addParticipants.mutate([id], { onSuccess: () => setPick(undefined) });
            }
          }}
        />
      </div>
      <Button variant="ghost" size="sm" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
