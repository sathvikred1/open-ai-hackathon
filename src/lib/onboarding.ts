export const ONBOARDING_STORAGE_KEY = "brolife:onboarding-profile";
export const ONBOARDING_PROFILE_EVENT = "brolife:onboarding-profile-updated";

export type OnboardingProfile = {
  version: 1;
  name: string;
  wakeUpTime: string;
  sleepTime: string;
  focusStartTime: string;
  focusEndTime: string;
  goals: string[];
  completedAt: string;
};

export function parseOnboardingProfile(
  value: string | null,
): OnboardingProfile | null {
  if (!value) return null;

  try {
    const profile = JSON.parse(value) as Partial<OnboardingProfile>;
    const hasRequiredFields =
      profile.version === 1 &&
      typeof profile.name === "string" &&
      typeof profile.wakeUpTime === "string" &&
      typeof profile.sleepTime === "string" &&
      typeof profile.focusStartTime === "string" &&
      typeof profile.focusEndTime === "string" &&
      Array.isArray(profile.goals) &&
      profile.goals.every((goal) => typeof goal === "string") &&
      typeof profile.completedAt === "string";

    return hasRequiredFields ? (profile as OnboardingProfile) : null;
  } catch {
    return null;
  }
}

export function getStoredOnboardingProfile() {
  if (typeof window === "undefined") return null;
  return parseOnboardingProfile(localStorage.getItem(ONBOARDING_STORAGE_KEY));
}

export function saveOnboardingProfile(profile: OnboardingProfile) {
  localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event(ONBOARDING_PROFILE_EVENT));
}
