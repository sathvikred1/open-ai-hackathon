export const PROGRESS_HISTORY_STORAGE_KEY = "brolife:progress-history";
export const PROGRESS_HISTORY_EVENT = "brolife:progress-history-updated";

export type DailyProgressSnapshot = {
  date: string;
  completedBlocks: number;
  totalBlocks: number;
  completedTaskBlocks: number;
  totalTaskBlocks: number;
  completedFocusMinutes: number;
  updatedAt: string;
};

type StoredProgressHistory = {
  version: 1;
  days: DailyProgressSnapshot[];
};

type ProgressPlanInput = {
  date: string;
  blocks: Array<{
    kind: "task" | "routine" | "meal";
    completed: boolean;
    focus: boolean;
    startMinutes: number;
    endMinutes: number;
  }>;
};

function isDailySnapshot(value: unknown): value is DailyProgressSnapshot {
  if (!value || typeof value !== "object") return false;
  const day = value as Partial<DailyProgressSnapshot>;
  return (
    typeof day.date === "string" &&
    typeof day.completedBlocks === "number" &&
    typeof day.totalBlocks === "number" &&
    typeof day.completedTaskBlocks === "number" &&
    typeof day.totalTaskBlocks === "number" &&
    typeof day.completedFocusMinutes === "number" &&
    typeof day.updatedAt === "string"
  );
}

export function parseProgressHistory(value: string | null) {
  if (!value) return [];
  try {
    const stored = JSON.parse(value) as Partial<StoredProgressHistory>;
    return stored.version === 1 &&
      Array.isArray(stored.days) &&
      stored.days.every(isDailySnapshot)
      ? stored.days
      : [];
  } catch {
    return [];
  }
}

export function recordDailyProgress(plan: ProgressPlanInput) {
  const history = parseProgressHistory(
    localStorage.getItem(PROGRESS_HISTORY_STORAGE_KEY),
  );
  const taskBlocks = plan.blocks.filter((block) => block.kind === "task");
  const snapshot: DailyProgressSnapshot = {
    date: plan.date,
    completedBlocks: plan.blocks.filter((block) => block.completed).length,
    totalBlocks: plan.blocks.length,
    completedTaskBlocks: taskBlocks.filter((block) => block.completed).length,
    totalTaskBlocks: taskBlocks.length,
    completedFocusMinutes: taskBlocks
      .filter((block) => block.completed && block.focus)
      .reduce(
        (minutes, block) =>
          minutes + Math.max(0, block.endMinutes - block.startMinutes),
        0,
      ),
    updatedAt: new Date().toISOString(),
  };
  const days = [
    ...history.filter((day) => day.date !== snapshot.date),
    snapshot,
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-60);

  localStorage.setItem(
    PROGRESS_HISTORY_STORAGE_KEY,
    JSON.stringify({ version: 1, days } satisfies StoredProgressHistory),
  );
  window.dispatchEvent(new Event(PROGRESS_HISTORY_EVENT));
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTrailingWeek(date = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(date);
    day.setHours(12, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    return {
      date: toLocalDateKey(day),
      dayLabel: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(
        day,
      ),
      dateLabel: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(day),
    };
  });
}
