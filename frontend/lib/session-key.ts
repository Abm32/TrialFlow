"use client";

import { useCallback, useEffect, useState } from "react";

const SESSION_KEY_STORAGE = "trialflow_session_key";
const DEFAULT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export type SessionKeyState = {
  granted: boolean;
  expiresAt: number | null;
  grantedAt: number | null;
};

const emptyState: SessionKeyState = { granted: false, expiresAt: null, grantedAt: null };

function load(): SessionKeyState {
  if (typeof window === "undefined") return emptyState;
  try {
    const raw = localStorage.getItem(SESSION_KEY_STORAGE);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as SessionKeyState;
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(SESSION_KEY_STORAGE);
      return emptyState;
    }
    return parsed;
  } catch {
    return emptyState;
  }
}

function persist(state: SessionKeyState) {
  localStorage.setItem(SESSION_KEY_STORAGE, JSON.stringify(state));
}

export function useSessionKey() {
  const [state, setState] = useState<SessionKeyState>(emptyState);

  useEffect(() => {
    setState(load());
  }, []);

  // Auto-expire check
  useEffect(() => {
    if (!state.expiresAt) return;
    const remaining = state.expiresAt - Date.now();
    if (remaining <= 0) {
      revoke();
      return;
    }
    const timer = setTimeout(revoke, remaining);
    return () => clearTimeout(timer);
  }, [state.expiresAt]);

  const grant = useCallback(() => {
    const now = Date.now();
    const next: SessionKeyState = {
      granted: true,
      grantedAt: now,
      expiresAt: now + DEFAULT_EXPIRY_MS,
    };
    persist(next);
    setState(next);
  }, []);

  const revoke = useCallback(() => {
    localStorage.removeItem(SESSION_KEY_STORAGE);
    setState(emptyState);
  }, []);

  const isActive = state.granted && state.expiresAt !== null && Date.now() < state.expiresAt;

  const remainingMs = isActive && state.expiresAt ? Math.max(0, state.expiresAt - Date.now()) : 0;

  return { ...state, isActive, remainingMs, grant, revoke };
}
