import { AppProviders } from "./providers";
import { AuthBootstrap } from "./AuthBootstrap";
import { AppRouter } from "./router";

export function App() {
  return (
    <AppProviders>
      <AuthBootstrap>
        <AppRouter />
      </AuthBootstrap>
    </AppProviders>
  );
}
