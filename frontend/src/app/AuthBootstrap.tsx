import { useEffect } from "react";
import type { ReactNode } from "react";
import { useAuthStore } from "../stores/authStore";
import { refreshSession } from "../features/auth/api";

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const setSession = useAuthStore((s) => s.setSession);
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping);

  useEffect(() => {
    let cancelled = false;

    refreshSession().then((session) => {
      if (cancelled) return;
      if (session) setSession(session.user, session.accessToken);
      setBootstrapping(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-shell">
        <div className="rounded-3xl bg-white px-6 py-4 text-sm font-medium text-ink shadow-panel">
          Loading Traky…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
