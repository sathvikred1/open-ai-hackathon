export const GOALS_STORAGE_KEY = "brolife:goals";
export const GOALS_EVENT = "brolife:goals-updated";

export type GoalPriority = "low" | "medium" | "high";

export type GoalTask = {
  id: string;
  title: string;
  completed: boolean;
};

export type Goal = {
  id: string;
  title: string;
  deadline: string | null;
  priority: GoalPriority;
  completed: boolean;
  tasks: GoalTask[];
  createdAt: string;
  updatedAt: string;
};

type StoredGoals = {
  version: 1;
  goals: Goal[];
};

function isGoalTask(value: unknown): value is GoalTask {
  if (!value || typeof value !== "object") return false;
  const task = value as Partial<GoalTask>;
  return (
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.completed === "boolean"
  );
}

function isGoal(value: unknown): value is Goal {
  if (!value || typeof value !== "object") return false;
  const goal = value as Partial<Goal>;
  return (
    typeof goal.id === "string" &&
    typeof goal.title === "string" &&
    (goal.deadline === null || typeof goal.deadline === "string") &&
    (goal.priority === "low" ||
      goal.priority === "medium" ||
      goal.priority === "high") &&
    typeof goal.completed === "boolean" &&
    Array.isArray(goal.tasks) &&
    goal.tasks.every(isGoalTask) &&
    typeof goal.createdAt === "string" &&
    typeof goal.updatedAt === "string"
  );
}

export function parseGoals(value: string | null): Goal[] {
  if (!value) return [];

  try {
    const stored = JSON.parse(value) as Partial<StoredGoals>;
    return stored.version === 1 &&
      Array.isArray(stored.goals) &&
      stored.goals.every(isGoal)
      ? stored.goals
      : [];
  } catch {
    return [];
  }
}

export function saveGoals(goals: Goal[]) {
  const payload: StoredGoals = { version: 1, goals };
  localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event(GOALS_EVENT));
}

export function createId(prefix: "goal" | "task") {
  const uniquePart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${uniquePart}`;
}

export function createGoalFromTitle(title: string): Goal {
  const now = new Date().toISOString();
  return {
    id: createId("goal"),
    title,
    deadline: null,
    priority: "medium",
    completed: false,
    tasks: [],
    createdAt: now,
    updatedAt: now,
  };
}
