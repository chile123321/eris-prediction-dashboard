import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ApiError, SESSION_EXPIRED_EVENT, isApiUnavailable, logout as apiLogout, restoreSession, type ApiUser } from "./api";

type SessionState =
  | { status: "loading" }
  | { status: "signedIn"; user: ApiUser }
  | { status: "signedOut" }
  | { status: "unavailable"; error: ApiError };

const SessionContext = createContext<{
  state: SessionState;
  reload: () => void;
  setUser: (user: ApiUser) => void;
  signOut: () => Promise<void>;
} | null>(null);

export function SessionProvider({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const [state, setState] = useState<SessionState>(enabled ? { status: "loading" } : { status: "signedOut" });
  const reload = useCallback(() => {
    setState({ status: "loading" });
    restoreSession()
      .then((user) => setState({ status: "signedIn", user }))
      .catch((error) =>
        setState(isApiUnavailable(error) ? { status: "unavailable", error } : { status: "signedOut" }),
      );
  }, []);
  useEffect(() => {
    if (!enabled) {
      setState({ status: "signedOut" });
      return;
    }
    reload();
    const onExpired = () => setState({ status: "signedOut" });
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [enabled, reload]);
  const signOut = useCallback(async () => {
    await apiLogout().catch(() => undefined);
    setState({ status: "signedOut" });
  }, []);
  return (
    <SessionContext.Provider value={{ state, reload, setUser: (user) => setState({ status: "signedIn", user }), signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
