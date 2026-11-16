"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { clearSession, getStoredToken, getStoredUser, setSession } from "@/lib/auth";
import type { AuthResponse, User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = getStoredToken();
    const u = getStoredUser();
    setToken(t);
    setUser(u);
    async function validate() {
      if (!t) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await api.get<User>("/api/users/me");
        setUser(me);
        setSession(t, me);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearSession();
          setToken(null);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    }
    validate();
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post<AuthResponse>("/api/auth/login", { email, password }, false);
    setSession(res.token, res.user);
    setToken(res.token);
    setUser(res.user);
  }

  async function register(data: { email: string; password: string; firstName: string; lastName: string }) {
    const res = await api.post<AuthResponse>("/api/auth/register", data, false);
    setSession(res.token, res.user);
    setToken(res.token);
    setUser(res.user);
  }

  function logout() {
    clearSession();
    setToken(null);
    setUser(null);
  }

  async function refreshMe() {
    if (!getStoredToken()) return;
    const me = await api.get<User>("/api/users/me");
    setUser(me);
    setSession(getStoredToken()!, me);
  }

  const value = useMemo(
    () => ({ user, token, isLoading, login, register, logout, refreshMe, setUser }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
