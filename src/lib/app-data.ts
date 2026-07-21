import {
  DAILY_PLAN_EVENT,
  DAILY_PLAN_STORAGE_KEY,
} from "@/lib/daily-planner";
import { GOALS_EVENT, GOALS_STORAGE_KEY } from "@/lib/goals";
import {
  ONBOARDING_PROFILE_EVENT,
  ONBOARDING_STORAGE_KEY,
} from "@/lib/onboarding";
import {
  PROGRESS_HISTORY_EVENT,
  PROGRESS_HISTORY_STORAGE_KEY,
} from "@/lib/progress-history";

const brolifeStorageKeys = [
  ONBOARDING_STORAGE_KEY,
  GOALS_STORAGE_KEY,
  DAILY_PLAN_STORAGE_KEY,
  PROGRESS_HISTORY_STORAGE_KEY,
];

const brolifeUpdateEvents = [
  ONBOARDING_PROFILE_EVENT,
  GOALS_EVENT,
  DAILY_PLAN_EVENT,
  PROGRESS_HISTORY_EVENT,
];

export function resetBrolifeAppData() {
  brolifeStorageKeys.forEach((key) => localStorage.removeItem(key));
  brolifeUpdateEvents.forEach((eventName) =>
    window.dispatchEvent(new Event(eventName)),
  );
}
