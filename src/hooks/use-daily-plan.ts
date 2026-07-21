"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  DAILY_PLAN_EVENT,
  DAILY_PLAN_STORAGE_KEY,
  parseDailyPlan,
} from "@/lib/daily-planner";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(DAILY_PLAN_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(DAILY_PLAN_EVENT, callback);
  };
}

function getSnapshot() {
  return localStorage.getItem(DAILY_PLAN_STORAGE_KEY);
}

function getServerSnapshot() {
  return null;
}

export function useDailyPlan() {
  const storedPlan = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return useMemo(() => parseDailyPlan(storedPlan), [storedPlan]);
}
