import { AppProviders } from "./providers";
import { AuthBootstrap } from "./AuthBootstrap";
import { AppRouter } from "./router";
import { initChatSocket } from "../features/chat/socket";

initChatSocket();

export function App() {
  return (
    <AppProviders>
      <AuthBootstrap>
        <AppRouter />
      </AuthBootstrap>
    </AppProviders>
  );
}
