import {
  createContext, useCallback, useContext, useState, type ReactNode,
} from "react";
import {
  getAccount, loadSession, persistSession, clearSession, updateAccount, type Session,
} from "./accounts";

type UserCtx = {
  session: Session | null;
  isLoggedIn: boolean;
  login: (email: string, remember?: boolean) => Session;
  logout: () => void;
  updateProfile: (patch: Partial<Session>) => void;
};

const Ctx = createContext<UserCtx>({
  session: null,
  isLoggedIn: false,
  login: () => ({ email: "", name: "", photo: "" }),
  logout: () => {},
  updateProfile: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession());

  const login = useCallback((email: string, remember = true): Session => {
    const acct = getAccount(email);
    const s: Session = acct
      ? { email: acct.email, name: acct.name, photo: acct.photo }
      : { email: email.toLowerCase(), name: email.split("@")[0], photo: "" };
    setSession(s);
    persistSession(s, remember);
    return s;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const updateProfile = useCallback((patch: Partial<Session>) => {
    setSession((s) => {
      if (!s) return s;
      const next = { ...s, ...patch };
      persistSession(next, true);
      if (patch.name !== undefined || patch.photo !== undefined) {
        updateAccount(s.email, { name: next.name, photo: next.photo });
      }
      return next;
    });
  }, []);

  return (
    <Ctx.Provider value={{ session, isLoggedIn: !!session, login, logout, updateProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useUser() {
  return useContext(Ctx);
}
