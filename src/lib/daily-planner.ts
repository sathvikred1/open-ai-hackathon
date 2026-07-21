import { Goal, GoalPriority } from "@/lib/goals";
import { OnboardingProfile } from "@/lib/onboarding";
import {
  interpretDisruptionLocally,
  isReplanInstructions,
  ReplanInstructions,
} from "@/lib/replanning";

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

export type ReplanChange = {
  blockId: string;
  title: string;
  type: "moved" | "shortened" | "removed" | "added";
  detail: string;
};

export type ReplanRecord = {
  report: string;
  replannedAt: string;
  instructions: ReplanInstructions;
  interpretationSource: "openai" | "local";
  fallbackReason: string | null;
  changes: ReplanChange[];
  explanation: string[];
};

export type DailyPlan = {
  version: 1;
  date: string;
  generatedAt: string;
  unscheduledCount: number;
  blocks: ScheduleBlock[];
  lastReplan: ReplanRecord | null;
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

function isReplanChange(value: unknown): value is ReplanChange {
  if (!value || typeof value !== "object") return false;
  const change = value as Partial<ReplanChange>;
  return (
    typeof change.blockId === "string" &&
    typeof change.title === "string" &&
    (change.type === "moved" ||
      change.type === "shortened" ||
      change.type === "removed" ||
      change.type === "added") &&
    typeof change.detail === "string"
  );
}

function isReplanRecord(value: unknown): value is ReplanRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<ReplanRecord>;
  return (
    typeof record.report === "string" &&
    typeof record.replannedAt === "string" &&
    isReplanInstructions(record.instructions) &&
    (record.interpretationSource === "openai" ||
      record.interpretationSource === "local") &&
    (record.fallbackReason === null ||
      typeof record.fallbackReason === "string") &&
    Array.isArray(record.changes) &&
    record.changes.every(isReplanChange) &&
    Array.isArray(record.explanation) &&
    record.explanation.every((item) => typeof item === "string")
  );
}

type LegacyReplanRecord = Omit<
  ReplanRecord,
  "instructions" | "interpretationSource" | "fallbackReason"
>;

function isLegacyReplanRecord(value: unknown): value is LegacyReplanRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<LegacyReplanRecord>;
  return (
    typeof record.report === "string" &&
    typeof record.replannedAt === "string" &&
    Array.isArray(record.changes) &&
    record.changes.every(isReplanChange) &&
    Array.isArray(record.explanation) &&
    record.explanation.every((item) => typeof item === "string")
  );
}

export function parseDailyPlan(value: string | null): DailyPlan | null {
  if (!value) return null;

  try {
    const plan = JSON.parse(value) as Partial<
      Omit<DailyPlan, "lastReplan">
    > & { lastReplan?: unknown };
    const validPlan =
      plan.version === 1 &&
      typeof plan.date === "string" &&
      typeof plan.generatedAt === "string" &&
      typeof plan.unscheduledCount === "number" &&
      Array.isArray(plan.blocks) &&
      plan.blocks.every(isScheduleBlock);

    if (!validPlan) return null;

    return {
      version: 1,
      date: plan.date as string,
      generatedAt: plan.generatedAt as string,
      unscheduledCount: plan.unscheduledCount as number,
      blocks: plan.blocks as ScheduleBlock[],
      lastReplan: isReplanRecord(plan.lastReplan)
        ? plan.lastReplan
        : isLegacyReplanRecord(plan.lastReplan)
          ? {
              ...plan.lastReplan,
              instructions: interpretDisruptionLocally(plan.lastReplan.report),
              interpretationSource: "local",
              fallbackReason: null,
            }
          : null,
    };
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
    lastReplan: null,
  };
}

function getTaskKeywords(taskQuery: string | null) {
  if (!taskQuery) return [];

  const keywords = taskQuery
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9]/g, ""))
    .filter((word) => word.length > 2);

  if (keywords.some((word) => ["workout", "exercise", "gym", "run"].includes(word))) {
    keywords.push("health", "movement", "fitness");
  }
  return [...new Set(keywords)];
}

function describeMove(block: ScheduleBlock, start: number, end: number) {
  const oldTime = `${formatPlanTime(block.startMinutes)}–${formatPlanTime(block.endMinutes)}`;
  const newTime = `${formatPlanTime(start)}–${formatPlanTime(end)}`;
  const oldDuration = block.endMinutes - block.startMinutes;
  const newDuration = end - start;

  if (newDuration < oldDuration) {
    return `Shortened from ${formatDurationLabel(oldDuration)} to ${formatDurationLabel(newDuration)} and placed at ${newTime}.`;
  }
  return `Moved from ${oldTime} to ${newTime}.`;
}

function formatDurationLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours} hr`;
}

export function replanDailySchedule({
  plan,
  report,
  instructions,
  interpretationSource,
  fallbackReason,
  nowMinutes,
}: {
  plan: DailyPlan;
  report: string;
  instructions: ReplanInstructions;
  interpretationSource: "openai" | "local";
  fallbackReason: string | null;
  nowMinutes: number;
}): DailyPlan {
  const normalizedReport = report.trim();
  const runningLate = instructions.delayMinutes > 0;
  const limitedTime = instructions.availableMinutes !== null;
  const lowEnergy = instructions.energyLevel === "low";
  const missedKeywords = getTaskKeywords(instructions.missedTaskQuery);
  const reportedMiss = missedKeywords.length > 0;
  const delay =
    instructions.delayMinutes ||
    (instructions.disruptionKind === "other" ? 30 : 0);

  const completedBlocks = plan.blocks.filter((block) => block.completed);
  const unfinishedTaskBlocks = plan.blocks
    .filter((block) => !block.completed && block.kind === "task")
    .sort((a, b) => a.startMinutes - b.startMinutes);
  const futureAnchors = plan.blocks.filter(
    (block) =>
      !block.completed && block.kind !== "task" && block.endMinutes > nowMinutes,
  );
  const expiredAnchors = plan.blocks.filter(
    (block) =>
      !block.completed && block.kind !== "task" && block.endMinutes <= nowMinutes,
  );

  const matchedMissedBlock = reportedMiss
    ? unfinishedTaskBlocks.find((block) => {
        const searchable = `${block.title} ${block.description}`.toLowerCase();
        return missedKeywords.some((keyword) => searchable.includes(keyword));
      })
    : undefined;
  const orderedTasks = matchedMissedBlock
    ? [
        matchedMissedBlock,
        ...unfinishedTaskBlocks.filter(
          (block) => block.id !== matchedMissedBlock.id,
        ),
      ]
    : unfinishedTaskBlocks;

  const originalFirstStart = unfinishedTaskBlocks.length
    ? Math.min(...unfinishedTaskBlocks.map((block) => block.startMinutes))
    : nowMinutes;
  const start = Math.max(nowMinutes, originalFirstStart + delay);
  const originalDayEnd = Math.max(
    ...plan.blocks.map((block) => block.endMinutes),
    start,
  );
  const schedulingEnd = limitedTime
    ? Math.min(
        originalDayEnd,
        nowMinutes + (instructions.availableMinutes ?? 0),
      )
    : originalDayEnd;
  const protectedIntervals = [...completedBlocks, ...futureAnchors].map(
    (block) => ({ start: block.startMinutes, end: block.endMinutes }),
  );
  const availableSlots =
    schedulingEnd - start >= 25
      ? subtractIntervals(
          { start, end: schedulingEnd },
          protectedIntervals,
        )
      : [];

  const changes: ReplanChange[] = expiredAnchors.map((block) => ({
    blockId: block.id,
    title: block.title,
    type: "removed" as const,
    detail: "Removed because its original time has already passed.",
  }));
  const rebuiltBlocks: ScheduleBlock[] = [];

  if (lowEnergy && availableSlots[0]?.end - availableSlots[0]?.start >= 40) {
    const resetStart = availableSlots[0].start;
    const resetEnd = resetStart + 15;
    const resetBlock: ScheduleBlock = {
      id: `plan-${plan.date}-recovery-reset`,
      kind: "routine",
      title: "Quick recovery break",
      description: "Pause, hydrate, and lower the pressure before continuing",
      startMinutes: resetStart,
      endMinutes: resetEnd,
      completed: false,
      focus: false,
      goalId: null,
      taskId: null,
      priority: null,
    };
    rebuiltBlocks.push(resetBlock);
    availableSlots[0] = { ...availableSlots[0], start: resetEnd + 5 };
    changes.push({
      blockId: resetBlock.id,
      title: resetBlock.title,
      type: "added",
      detail: `Added a 15-minute reset at ${formatPlanTime(resetStart)}.`,
    });
  }

  const remainingTasks = [...orderedTasks];
  for (const slot of availableSlots) {
    let cursor = slot.start;
    while (remainingTasks.length > 0 && slot.end - cursor >= 25) {
      const block = remainingTasks.shift();
      if (!block) break;

      const originalDuration = block.endMinutes - block.startMinutes;
      const energyAdjustedDuration = lowEnergy
        ? Math.max(25, Math.floor((originalDuration * 0.75) / 5) * 5)
        : originalDuration;
      const nextDuration = Math.min(energyAdjustedDuration, slot.end - cursor);
      const nextBlock = {
        ...block,
        startMinutes: cursor,
        endMinutes: cursor + nextDuration,
      };
      rebuiltBlocks.push(nextBlock);

      if (
        nextBlock.startMinutes !== block.startMinutes ||
        nextBlock.endMinutes !== block.endMinutes
      ) {
        changes.push({
          blockId: block.id,
          title: block.title,
          type:
            nextDuration < originalDuration ? "shortened" : ("moved" as const),
          detail: describeMove(block, nextBlock.startMinutes, nextBlock.endMinutes),
        });
      }

      cursor = nextBlock.endMinutes;
      if (slot.end - cursor >= 35 && remainingTasks.length > 0) cursor += 10;
    }
  }

  for (const block of remainingTasks) {
    changes.push({
      blockId: block.id,
      title: block.title,
      type: "removed",
      detail: "Deferred because it no longer fits before your sleep boundary.",
    });
  }

  const explanation = [
    `Protected ${completedBlocks.length} completed ${completedBlocks.length === 1 ? "block without changing it" : "blocks without changing them"}.`,
  ];
  if (runningLate) {
    explanation.push(`Shifted unfinished work by ${formatDurationLabel(delay)}.`);
  }
  if (reportedMiss) {
    explanation.push(
      matchedMissedBlock
        ? `Prioritized “${matchedMissedBlock.title}” so it gets another place today.`
        : "Could not match the missed activity exactly, so the remaining plan was rebuilt from now.",
    );
  }
  if (lowEnergy) {
    explanation.push(
      "Added recovery time and shortened unfinished work to reduce the load.",
    );
  }
  if (limitedTime) {
    explanation.push(
      `Kept only what fits inside the next ${formatDurationLabel(instructions.availableMinutes ?? 0)}.`,
    );
  }
  if (!runningLate && !reportedMiss && !lowEnergy && !limitedTime) {
    explanation.push(
      "Used a 30-minute disruption buffer and rebuilt unfinished work from now.",
    );
  }
  explanation.push("Kept future meal and sleep anchors in place where possible.");
  if (remainingTasks.length > 0) {
    explanation.push(
      `Deferred ${remainingTasks.length} lower-positioned ${remainingTasks.length === 1 ? "block" : "blocks"} that no longer fit.`,
    );
  }

  return {
    ...plan,
    unscheduledCount: plan.unscheduledCount + remainingTasks.length,
    blocks: [
      ...completedBlocks,
      ...futureAnchors,
      ...rebuiltBlocks,
    ].sort((a, b) => a.startMinutes - b.startMinutes),
    lastReplan: {
      report: normalizedReport,
      replannedAt: new Date().toISOString(),
      instructions,
      interpretationSource,
      fallbackReason,
      changes,
      explanation,
    },
  };
}
