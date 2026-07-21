"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  parseProgressHistory,
  PROGRESS_HISTORY_EVENT,
  PROGRESS_HISTORY_STORAGE_KEY,
} from "@/lib/progress-history";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(PROGRESS_HISTORY_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(PROGRESS_HISTORY_EVENT, callback);
  };
}

function getSnapshot() {
  return localStorage.getItem(PROGRESS_HISTORY_STORAGE_KEY);
}

function getServerSnapshot() {
  return null;
}

export function useProgressHistory() {
  const storedHistory = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return useMemo(
    () => parseProgressHistory(storedHistory),
    [storedHistory],
  );
}
