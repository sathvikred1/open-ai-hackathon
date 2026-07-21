import { Goal, GoalPriority } from "@/lib/goals";
import { OnboardingProfile } from "@/lib/onboarding";

export const DAILY_PLAN_STORAGE_KEY = "brolife:daily-plan";
export const DAILY_PLAN_EVENT = "brolife:daily-plan-updated";

export type ScheduleBlockKind = "task" | "routine" | "meal";

export type ScheduleBlock = {
  id: string;
  kind: ScheduleBlockKind;
  title: string;
  description: string;
  startMinutes: number;
  endMinutes: number;
  completed: boolean;
  focus: boolean;
  goalId: string | null;
  taskId: string | null;
  priority: GoalPriority | null;
};

export type DailyPlan = {
  version: 1;
  date: string;
  generatedAt: string;
  unscheduledCount: number;
  blocks: ScheduleBlock[];
};

type Interval = { start: number; end: number };

type WorkCandidate = {
  key: string;
  title: string;
  goalTitle: string;
  goalId: string;
  taskId: string | null;
  priority: GoalPriority;
  duration: number;
};

const priorityRank: Record<GoalPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function parseTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function normalizeAfter(value: number, reference: number) {
  let normalized = value;
  while (normalized < reference) normalized += 24 * 60;
  return normalized;
}

function subtractIntervals(base: Interval, blocked: Interval[]) {
  return blocked
    .sort((a, b) => a.start - b.start)
    .reduce<Interval[]>((available, block) => {
      return available.flatMap((interval) => {
        if (block.end <= interval.start || block.start >= interval.end) {
          return [interval];
        }

        const pieces: Interval[] = [];
        if (block.start > interval.start) {
          pieces.push({ start: interval.start, end: block.start });
        }
        if (block.end < interval.end) {
          pieces.push({ start: block.end, end: interval.end });
        }
        return pieces;
      });
    }, [base])
    .filter((interval) => interval.end - interval.start >= 25);
}

function intersect(interval: Interval, target: Interval) {
  const start = Math.max(interval.start, target.start);
  const end = Math.min(interval.end, target.end);
  return end - start >= 25 ? { start, end } : null;
}

function makeRoutineBlock(
  date: string,
  key: string,
  title: string,
  description: string,
  kind: "routine" | "meal",
  startMinutes: number,
  endMinutes: number,
): ScheduleBlock {
  return {
    id: `plan-${date}-${key}`,
    kind,
    title,
    description,
    startMinutes,
    endMinutes,
    completed: false,
    focus: false,
    goalId: null,
    taskId: null,
    priority: null,
  };
}

function getWorkCandidates(goals: Goal[]) {
  const activeGoals = goals
    .filter((goal) => !goal.completed)
    .sort((a, b) => {
      const priorityDifference =
        priorityRank[a.priority] - priorityRank[b.priority];
      if (priorityDifference !== 0) return priorityDifference;

      const aDeadline = a.deadline || "9999-12-31";
      const bDeadline = b.deadline || "9999-12-31";
      const deadlineDifference = aDeadline.localeCompare(bDeadline);
      return deadlineDifference || a.createdAt.localeCompare(b.createdAt);
    });

  return activeGoals.flatMap<WorkCandidate>((goal) => {
    const unfinishedTasks = goal.tasks.filter((task) => !task.completed);
    const duration = goal.priority === "high" ? 60 : goal.priority === "medium" ? 45 : 30;

    if (unfinishedTasks.length === 0) {
      return [
        {
          key: `goal-${goal.id}`,
          title: `Make progress on ${goal.title}`,
          goalTitle: goal.title,
          goalId: goal.id,
          taskId: null,
          priority: goal.priority,
          duration,
        },
      ];
    }

    return unfinishedTasks.map((task) => ({
      key: `task-${goal.id}-${task.id}`,
      title: task.title,
      goalTitle: goal.title,
      goalId: goal.id,
      taskId: task.id,
      priority: goal.priority,
      duration,
    }));
  });
}

function isScheduleBlock(value: unknown): value is ScheduleBlock {
  if (!value || typeof value !== "object") return false;
  const block = value as Partial<ScheduleBlock>;
  return (
    typeof block.id === "string" &&
    (block.kind === "task" ||
      block.kind === "routine" ||
      block.kind === "meal") &&
    typeof block.title === "string" &&
    typeof block.description === "string" &&
    typeof block.startMinutes === "number" &&
    typeof block.endMinutes === "number" &&
    typeof block.completed === "boolean" &&
    typeof block.focus === "boolean" &&
    (block.goalId === null || typeof block.goalId === "string") &&
    (block.taskId === null || typeof block.taskId === "string") &&
    (block.priority === null ||
      block.priority === "low" ||
      block.priority === "medium" ||
      block.priority === "high")
  );
}

export function parseDailyPlan(value: string | null): DailyPlan | null {
  if (!value) return null;

  try {
    const plan = JSON.parse(value) as Partial<DailyPlan>;
    return plan.version === 1 &&
      typeof plan.date === "string" &&
      typeof plan.generatedAt === "string" &&
      typeof plan.unscheduledCount === "number" &&
      Array.isArray(plan.blocks) &&
      plan.blocks.every(isScheduleBlock)
      ? (plan as DailyPlan)
      : null;
  } catch {
    return null;
  }
}

export function saveDailyPlan(plan: DailyPlan) {
  localStorage.setItem(DAILY_PLAN_STORAGE_KEY, JSON.stringify(plan));
  window.dispatchEvent(new Event(DAILY_PLAN_EVENT));
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatPlanTime(minutes: number) {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const displayMinutes = String(normalized % 60).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${displayMinutes} ${period}`;
}

export function createGoalsFromProfile(profile: OnboardingProfile): Goal[] {
  return profile.goals.map((title, index) => ({
    id: `onboarding-goal-${index}`,
    title,
    deadline: null,
    priority: "medium",
    completed: false,
    tasks: [],
    createdAt: `profile-${String(index).padStart(3, "0")}`,
    updatedAt: `profile-${String(index).padStart(3, "0")}`,
  }));
}

export function generateDailyPlan({
  profile,
  goals,
  date,
  previousPlan,
}: {
  profile: OnboardingProfile;
  goals: Goal[];
  date: string;
  previousPlan?: DailyPlan | null;
}): DailyPlan {
  const wake = parseTime(profile.wakeUpTime);
  let sleep = parseTime(profile.sleepTime);
  if (sleep <= wake) sleep += 24 * 60;

  const dayEnd = Math.max(sleep, wake + 4 * 60);
  const morningEnd = Math.min(wake + 30, dayEnd);
  const windDownStart = Math.max(morningEnd, dayEnd - 30);

  const focusStart = normalizeAfter(parseTime(profile.focusStartTime), wake);
  let focusEnd = parseTime(profile.focusEndTime);
  focusEnd = normalizeAfter(focusEnd, focusStart);
  if (focusEnd <= focusStart) focusEnd += 24 * 60;
  const focusWindow = {
    start: Math.max(morningEnd, focusStart),
    end: Math.min(windDownStart, focusEnd),
  };

  const routineBlocks: ScheduleBlock[] = [
    makeRoutineBlock(
      date,
      "morning-reset",
      "Morning reset",
      "Wake up, hydrate, and get ready for the day",
      "routine",
      wake,
      morningEnd,
    ),
  ];

  const mealIntervals: Interval[] = [];
  const lunchClock = normalizeAfter(12 * 60 + 30, wake);
  const lunchStart = Math.min(
    Math.max(lunchClock, wake + 4 * 60),
    windDownStart - 45,
  );
  if (lunchStart >= morningEnd && lunchStart + 45 <= windDownStart) {
    mealIntervals.push({ start: lunchStart, end: lunchStart + 45 });
    routineBlocks.push(
      makeRoutineBlock(
        date,
        "lunch-reset",
        "Lunch and reset",
        "Step away, refuel, and give your mind a break",
        "meal",
        lunchStart,
        lunchStart + 45,
      ),
    );
  }

  const dinnerClock = normalizeAfter(18 * 60 + 30, wake);
  const minimumDinnerStart = mealIntervals.length
    ? mealIntervals[0].end + 4 * 60
    : wake + 9 * 60;
  const dinnerStart = Math.min(
    Math.max(dinnerClock, minimumDinnerStart),
    windDownStart - 45,
  );
  if (
    dinnerStart >= morningEnd &&
    dinnerStart + 45 <= windDownStart &&
    !mealIntervals.some(
      (meal) => dinnerStart < meal.end && dinnerStart + 45 > meal.start,
    )
  ) {
    mealIntervals.push({ start: dinnerStart, end: dinnerStart + 45 });
    routineBlocks.push(
      makeRoutineBlock(
        date,
        "dinner-reset",
        "Dinner and recharge",
        "Put work down for a moment and recharge",
        "meal",
        dinnerStart,
        dinnerStart + 45,
      ),
    );
  }

  if (windDownStart < dayEnd) {
    routineBlocks.push(
      makeRoutineBlock(
        date,
        "wind-down",
        "Wind down",
        "Close the day gently and get ready for sleep",
        "routine",
        windDownStart,
        dayEnd,
      ),
    );
  }

  const availability = subtractIntervals(
    { start: morningEnd, end: windDownStart },
    mealIntervals,
  );
  const hasFocusWindow = focusWindow.end - focusWindow.start >= 25;
  const focusSlots = hasFocusWindow
    ? availability
        .map((interval) => intersect(interval, focusWindow))
        .filter((interval): interval is Interval => interval !== null)
    : [];
  const normalSlots = availability.flatMap((interval) =>
    hasFocusWindow ? subtractIntervals(interval, [focusWindow]) : [interval],
  );

  const candidates = getWorkCandidates(goals);
  const remaining = [...candidates];
  const workBlocks: ScheduleBlock[] = [];

  function scheduleInto(slots: Interval[], focus: boolean) {
    for (const slot of slots) {
      let cursor = slot.start;
      while (remaining.length > 0 && slot.end - cursor >= 25) {
        const candidate = remaining.shift();
        if (!candidate) break;

        const duration = Math.min(candidate.duration, slot.end - cursor);
        workBlocks.push({
          id: `plan-${date}-${candidate.key}`,
          kind: "task",
          title: candidate.title,
          description: candidate.goalTitle,
          startMinutes: cursor,
          endMinutes: cursor + duration,
          completed: false,
          focus,
          goalId: candidate.goalId,
          taskId: candidate.taskId,
          priority: candidate.priority,
        });
        cursor += duration;

        if (slot.end - cursor >= 35 && remaining.length > 0) {
          cursor += 10;
        }
      }
    }
  }

  scheduleInto(focusSlots, true);
  scheduleInto(normalSlots, false);

  const completedById = new Map(
    previousPlan?.date === date
      ? previousPlan.blocks.map((block) => [block.id, block.completed])
      : [],
  );
  const blocks = [...routineBlocks, ...workBlocks]
    .map((block) => ({
      ...block,
      completed: completedById.get(block.id) ?? false,
    }))
    .sort((a, b) => a.startMinutes - b.startMinutes);

  return {
    version: 1,
    date,
    generatedAt: new Date().toISOString(),
    unscheduledCount: remaining.length,
    blocks,
  };
}
