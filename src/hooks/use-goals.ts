"use client";

import { useMemo, useSyncExternalStore } from "react";

import { GOALS_EVENT, GOALS_STORAGE_KEY, parseGoals } from "@/lib/goals";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(GOALS_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(GOALS_EVENT, callback);
  };
}

function getSnapshot() {
  return localStorage.getItem(GOALS_STORAGE_KEY);
}

function getServerSnapshot() {
  return null;
}

export function useGoals() {
  const storedGoals = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return {
    goals: useMemo(() => parseGoals(storedGoals), [storedGoals]),
    hasStoredGoals: storedGoals !== null,
  };
}
