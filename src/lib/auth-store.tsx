import { createContext, useContext, useState, type ReactNode } from "react";
import { setAuthToken, logout as apiLogout, type ApiUser } from "./api";

const STORAGE_KEY = "nethras_user";

type AuthState = {
  user: ApiUser | null;
  login: (user: ApiUser, token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Restore synchronously so route guards (e.g. the admin area) see the saved user on
  // the very first render instead of redirecting to /account before an effect runs.
  const [user, setUser] = useState<ApiUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ApiUser) : null;
    } catch {
      return null; // ignore corrupt storage or missing localStorage
    }
  });

  const login = (u: ApiUser, token: string) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setAuthToken(token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    apiLogout().catch(() => {}); // best-effort: invalidate the token server-side too
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
