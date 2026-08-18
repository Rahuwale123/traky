import { useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { SearchableSelect } from "../../../components/ui/SearchableSelect";
import { Button } from "../../../components/ui/Button";
import { Avatar } from "../../../components/ui/Avatar";
import { cn } from "../../../lib/utils";
import { getApiErrorMessage } from "../../../lib/api";
import { useChatContacts, useCreateConversation } from "../hooks";
import type { ConversationType } from "../types";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}

export function NewChatModal({ isOpen, onClose, onCreated }: NewChatModalProps) {
  const contacts = useChatContacts();
  const createConversation = useCreateConversation();

  const [mode, setMode] = useState<ConversationType>("DIRECT");
  const [directContactId, setDirectContactId] = useState<string | undefined>();
  const [groupName, setGroupName] = useState("");
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]);
  const [picker, setPicker] = useState<string | undefined>();

  const close = () => {
    setMode("DIRECT");
    setDirectContactId(undefined);
    setGroupName("");
    setGroupMemberIds([]);
    setPicker(undefined);
    createConversation.reset();
    onClose();
  };

  const contactById = new Map((contacts.data ?? []).map((c) => [c.id, c]));
  const availableForGroup = (contacts.data ?? []).filter((c) => !groupMemberIds.includes(c.id));

  const submit = () => {
    if (mode === "DIRECT") {
      if (!directContactId) return;
      createConversation.mutate(
        { type: "DIRECT", participantId: directContactId },
        { onSuccess: (convo) => { onCreated(convo.id); close(); } },
      );
    } else {
      if (!groupName.trim() || groupMemberIds.length === 0) return;
      createConversation.mutate(
        { type: "GROUP", name: groupName.trim(), participantIds: groupMemberIds },
        { onSuccess: (convo) => { onCreated(convo.id); close(); } },
      );
    }
  };

  const canSubmit = mode === "DIRECT" ? !!directContactId : groupName.trim().length > 0 && groupMemberIds.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={close} title="New chat">
      <div className="flex flex-col gap-4">
        <div className="flex rounded-full bg-black/[0.04] p-1">
          {(["DIRECT", "GROUP"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              className={cn(
                "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                mode === option ? "bg-white text-ink shadow-soft" : "text-muted hover:text-ink",
              )}
            >
              {option === "DIRECT" ? "Direct message" : "Group chat"}
            </button>
          ))}
        </div>

        {mode === "DIRECT" ? (
          <SearchableSelect
            label="Send a message to"
            placeholder="Search teammates…"
            options={(contacts.data ?? []).map((c) => ({ id: c.id, label: c.fullName, group: c.role }))}
            value={directContactId}
            onChange={setDirectContactId}
          />
        ) : (
          <>
            <Input label="Group name" placeholder="e.g. Website Revamp Team" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            <SearchableSelect
              label="Add members"
              placeholder="Search teammates…"
              options={availableForGroup.map((c) => ({ id: c.id, label: c.fullName, group: c.role }))}
              value={picker}
              onChange={(id) => {
                if (id) setGroupMemberIds((prev) => [...prev, id]);
                setPicker(undefined);
              }}
            />
            {groupMemberIds.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {groupMemberIds.map((id) => {
                  const contact = contactById.get(id);
                  if (!contact) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-2 rounded-full bg-accent/10 py-1 pl-1 pr-3 text-xs font-medium text-accent"
                    >
                      <Avatar name={contact.fullName} size={20} />
                      {contact.fullName}
                      <button
                        type="button"
                        onClick={() => setGroupMemberIds((prev) => prev.filter((mid) => mid !== id))}
                        className="text-accent/70 hover:text-accent"
                        aria-label={`Remove ${contact.fullName}`}
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : null}
          </>
        )}

        {createConversation.isError ? (
          <p className="text-sm text-rose-600">{getApiErrorMessage(createConversation.error, "Could not start the chat")}</p>
        ) : null}

        <div className="mt-1 flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit} isLoading={createConversation.isPending}>
            {mode === "DIRECT" ? "Start chat" : "Create group"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
