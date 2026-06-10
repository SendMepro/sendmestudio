"use client";

import { useState, useEffect, useCallback } from "react";

interface UseBrainAdminAuthOptions {
  loadSummary: () => Promise<void>;
  loadStorageStats: () => Promise<void>;
  loadNightQueue: () => Promise<void>;
}

interface UseBrainAdminAuthReturn {
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  password: string;
  loginError: string;
  localDevKeyHint: string;
  isSuperAdmin: boolean;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  handleLogin: () => Promise<void>;
}

export function useBrainAdminAuth({
  loadSummary,
  loadStorageStats,
  loadNightQueue,
}: UseBrainAdminAuthOptions): UseBrainAdminAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [localDevKeyHint, setLocalDevKeyHint] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/brain-admin/session", {
          cache: "no-store",
        });
        const data = await response.json();
        setIsAuthenticated(Boolean(data.authenticated));
        setIsSuperAdmin(Boolean(data.isSuperAdmin));
        setLocalDevKeyHint(
          typeof data.localDevKeyHint === "string"
            ? data.localDevKeyHint
            : ""
        );

        if (data.authenticated) {
          await loadSummary();
          await loadStorageStats();
          await loadNightQueue();
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    void checkSession();
  }, [loadSummary, loadStorageStats, loadNightQueue]);

  const handleLogin = useCallback(async () => {
    setLoginError("");
    const response = await fetch("/api/brain-admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await response.json();

    if (!response.ok || !data.authenticated) {
      setLoginError("Clave admin incorrecta.");
      return;
    }

    setIsAuthenticated(true);
    setIsSuperAdmin(Boolean(data.isSuperAdmin));
    setPassword("");
    await loadSummary();
  }, [password, loadSummary]);

  return {
    isAuthenticated,
    isCheckingAuth,
    password,
    loginError,
    localDevKeyHint,
    isSuperAdmin,
    setPassword,
    handleLogin,
  };
}
