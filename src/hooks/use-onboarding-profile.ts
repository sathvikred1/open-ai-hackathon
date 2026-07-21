"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  ONBOARDING_PROFILE_EVENT,
  ONBOARDING_STORAGE_KEY,
  parseOnboardingProfile,
} from "@/lib/onboarding";

function subscribeToProfile(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(ONBOARDING_PROFILE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(ONBOARDING_PROFILE_EVENT, callback);
  };
}

function getProfileSnapshot() {
  return localStorage.getItem(ONBOARDING_STORAGE_KEY);
}

function getServerProfileSnapshot() {
  return null;
}

const subscribeToHydration = () => () => undefined;

export function useHasHydrated() {
  return useSyncExternalStore(subscribeToHydration, () => true, () => false);
}

export function useOnboardingProfile() {
  const storedProfile = useSyncExternalStore(
    subscribeToProfile,
    getProfileSnapshot,
    getServerProfileSnapshot,
  );

  return useMemo(() => parseOnboardingProfile(storedProfile), [storedProfile]);
}
