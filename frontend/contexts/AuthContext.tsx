"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const TOKEN_KEY = "admin_token";
const EMAIL_KEY = "admin_email";

type AuthState = {
  user: { email: string } | null;
  loading: boolean;
  getToken: () => Promise<string | null>;
  signOut: () => void;
  setAuth: (token: string, email: string) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setToken(localStorage.getItem(TOKEN_KEY));
    setEmail(localStorage.getItem(EMAIL_KEY));
    setLoading(false);
  }, []);

  const user = token && email ? { email } : null;

  const getToken = useCallback(async () => {
    return localStorage.getItem(TOKEN_KEY);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    setToken(null);
    setEmail(null);
  }, []);

  const setAuth = useCallback((t: string, e: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(EMAIL_KEY, e);
    setToken(t);
    setEmail(e);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, getToken, signOut, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
