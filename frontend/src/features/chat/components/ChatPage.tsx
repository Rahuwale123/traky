import { useState } from "react";
import { AppShell } from "../../../app/layout/AppShell";
import { PageHeader } from "../../../app/layout/PageHeader";
import { adminNavItems, employeeNavItems, managerNavItems } from "../../../app/nav";
import { useAuthStore } from "../../../stores/authStore";
import { ConversationList } from "./ConversationList";
import { ConversationThread } from "./ConversationThread";
import { NewChatModal } from "./NewChatModal";

export function ChatPage() {
  const role = useAuthStore((s) => s.user?.role);
  const navItems = role === "ADMIN" ? adminNavItems : role === "MANAGER" ? managerNavItems : employeeNavItems;

  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  return (
    <AppShell navItems={navItems}>
      <PageHeader crumbs={["Home", "Chat"]} title="Chat" />

      <div className="flex h-[calc(100vh-14rem)] min-h-[420px] overflow-hidden rounded-3xl border border-black/10 bg-white shadow-soft">
        <ConversationList selectedId={selectedId} onSelect={setSelectedId} onNewChat={() => setIsNewChatOpen(true)} />

        {selectedId ? (
          <ConversationThread conversationId={selectedId} onLeft={() => setSelectedId(undefined)} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-semibold text-ink-soft">Select a chat to start messaging</p>
            <p className="text-xs text-muted">Or start a new direct message or group chat.</p>
          </div>
        )}
      </div>

      <NewChatModal isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} onCreated={setSelectedId} />
    </AppShell>
  );
}
