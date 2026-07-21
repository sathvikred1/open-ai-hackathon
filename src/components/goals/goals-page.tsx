"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Flag,
  ListChecks,
  Pencil,
  Plus,
  Target,
  Trash2,
  Trophy,
  X,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useGoals } from "@/hooks/use-goals";
import {
  useHasHydrated,
  useOnboardingProfile,
} from "@/hooks/use-onboarding-profile";
import {
  createGoalFromTitle,
  createId,
  Goal,
  GoalPriority,
  GoalTask,
  saveGoals,
} from "@/lib/goals";
import { cn } from "@/lib/utils";

type GoalDraft = {
  title: string;
  deadline: string;
  priority: GoalPriority;
  tasks: GoalTask[];
};

const priorityDetails: Record<
  GoalPriority,
  { label: string; className: string; dot: string }
> = {
  high: {
    label: "High priority",
    className: "border-0 bg-rose-50 text-rose-700 ring-1 ring-rose-600/10",
    dot: "bg-rose-500",
  },
  medium: {
    label: "Medium priority",
    className: "border-0 bg-amber-50 text-amber-700 ring-1 ring-amber-600/10",
    dot: "bg-amber-500",
  },
  low: {
    label: "Low priority",
    className: "border-0 bg-sky-50 text-sky-700 ring-1 ring-sky-600/10",
    dot: "bg-sky-500",
  },
};

function formatDeadline(deadline: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${deadline}T00:00:00`));
}

function GoalEditor({
  goal,
  onClose,
  onSave,
}: {
  goal: Goal | null;
  onClose: () => void;
  onSave: (draft: GoalDraft) => void;
}) {
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<GoalDraft>(() => ({
    title: goal?.title ?? "",
    deadline: goal?.deadline ?? "",
    priority: goal?.priority ?? "medium",
    tasks:
      goal?.tasks.length
        ? goal.tasks.map((task) => ({ ...task }))
        : [{ id: createId("task"), title: "", completed: false }],
  }));

  function updateTask(id: string, title: string) {
    setDraft((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === id ? { ...task, title } : task,
      ),
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.title.trim().length < 2) {
      setError("Give this goal a clear title.");
      return;
    }

    onSave({
      ...draft,
      title: draft.title.trim(),
      tasks: draft.tasks
        .map((task) => ({ ...task, title: task.title.trim() }))
        .filter((task) => task.title.length > 0),
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pr-8">
            <DialogTitle className="text-lg font-semibold">
              {goal ? "Edit goal" : "Create a new goal"}
            </DialogTitle>
            <DialogDescription>
              Keep it specific, then add a few tasks that move it forward.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-6">
            <div className="space-y-2">
              <Label htmlFor="goal-title">Goal title</Label>
              <Input
                id="goal-title"
                value={draft.title}
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }));
                  setError("");
                }}
                placeholder="e.g. Launch the Brolife MVP"
                autoFocus
                className="h-11 rounded-xl"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="goal-deadline">Deadline (optional)</Label>
                <Input
                  id="goal-deadline"
                  type="date"
                  value={draft.deadline}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      deadline: event.target.value,
                    }))
                  }
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-priority">Priority</Label>
                <select
                  id="goal-priority"
                  value={draft.priority}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      priority: event.target.value as GoalPriority,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition-shadow focus:border-ring focus:ring-3 focus:ring-ring/50"
                >
                  <option value="high">High priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="low">Low priority</option>
                </select>
              </div>
            </div>

            <Separator />

            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <Label>Tasks</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Break the goal into up to six manageable steps.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      tasks: [
                        ...current.tasks,
                        { id: createId("task"), title: "", completed: false },
                      ],
                    }))
                  }
                  disabled={draft.tasks.length >= 6}
                >
                  <Plus /> Add task
                </Button>
              </div>

              <div className="space-y-2">
                {draft.tasks.map((task, index) => (
                  <div key={task.id} className="flex items-center gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground">
                      {index + 1}
                    </span>
                    <Input
                      value={task.title}
                      onChange={(event) => updateTask(task.id, event.target.value)}
                      placeholder="Add a concrete next step"
                      aria-label={`Task ${index + 1}`}
                      className="h-10 rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove task ${index + 1}`}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          tasks: current.tasks.filter(
                            (currentTask) => currentTask.id !== task.id,
                          ),
                        }))
                      }
                    >
                      <X />
                    </Button>
                  </div>
                ))}
                {draft.tasks.length === 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        tasks: [
                          { id: createId("task"), title: "", completed: false },
                        ],
                      }))
                    }
                    className="flex h-16 w-full items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:bg-emerald-50/50 hover:text-foreground"
                  >
                    <Plus className="mr-2 size-4" /> Add the first task
                  </button>
                ) : null}
              </div>
            </div>

            <div className="min-h-5" aria-live="polite">
              {error ? (
                <p className="text-sm font-medium text-destructive">{error}</p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="min-w-28">
              {goal ? "Save changes" : "Create goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
  onToggleGoal,
  onToggleTask,
}: {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
  onToggleGoal: () => void;
  onToggleTask: (taskId: string) => void;
}) {
  const completedTasks = goal.tasks.filter((task) => task.completed).length;
  const progress = goal.tasks.length
    ? Math.round((completedTasks / goal.tasks.length) * 100)
    : goal.completed
      ? 100
      : 0;
  const priority = priorityDetails[goal.priority];

  return (
    <Card
      className={cn(
        "gap-0 border-0 py-0 shadow-none ring-1 ring-foreground/8 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/5",
        goal.completed && "bg-muted/35 opacity-75",
      )}
    >
      <CardHeader className="px-5 pb-4 pt-5">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={goal.completed}
            onCheckedChange={onToggleGoal}
            aria-label={`Mark ${goal.title} ${goal.completed ? "active" : "complete"}`}
            className="mt-1 size-[18px]"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={priority.className}>
                <span className={cn("size-1.5 rounded-full", priority.dot)} />
                {priority.label}
              </Badge>
              {goal.completed ? (
                <Badge className="border-0 bg-emerald-100 text-emerald-800">
                  <Check className="size-3" /> Complete
                </Badge>
              ) : null}
            </div>
            <h2
              className={cn(
                "mt-3 text-lg font-semibold leading-6 tracking-tight",
                goal.completed && "line-through decoration-muted-foreground/40",
              )}
            >
              {goal.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                {goal.deadline ? formatDeadline(goal.deadline) : "No deadline"}
              </span>
              <span className="flex items-center gap-1.5">
                <ListChecks className="size-3.5" />
                {completedTasks} of {goal.tasks.length} tasks
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit ${goal.title}`}
              onClick={onEdit}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${goal.title}`}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5">
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>Progress</span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <Progress
            value={progress}
            className="[&_[data-slot=progress-indicator]]:bg-emerald-600"
          />
        </div>

        <div className="space-y-1.5">
          {goal.tasks.map((task) => (
            <label
              key={task.id}
              className="group/task flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted/70"
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onToggleTask(task.id)}
                aria-label={`Mark ${task.title} ${task.completed ? "incomplete" : "complete"}`}
                className="mt-0.5"
              />
              <span
                className={cn(
                  "text-sm leading-5",
                  task.completed &&
                    "text-muted-foreground line-through decoration-muted-foreground/40",
                )}
              >
                {task.title}
              </span>
            </label>
          ))}
          {goal.tasks.length === 0 ? (
            <button
              type="button"
              onClick={onEdit}
              className="flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-3 text-left text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:bg-emerald-50/50 hover:text-foreground"
            >
              <Plus className="size-3.5" /> Add tasks to make this goal actionable
            </button>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="justify-between border-t bg-muted/25 px-5 py-3 text-xs text-muted-foreground">
        <span>{goal.completed ? "Goal completed" : "Keep the momentum going"}</span>
        {progress === 100 && !goal.completed ? (
          <Button variant="ghost" size="sm" onClick={onToggleGoal}>
            Complete goal <CheckCircle2 />
          </Button>
        ) : (
          <Flag className="size-3.5" />
        )}
      </CardFooter>
    </Card>
  );
}

export function GoalsPage() {
  const { goals, hasStoredGoals } = useGoals();
  const profile = useOnboardingProfile();
  const hasHydrated = useHasHydrated();
  const [filter, setFilter] = useState<"all" | "active" | "complete">("all");
  const [editorGoal, setEditorGoal] = useState<Goal | null | undefined>();
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  useEffect(() => {
    if (hasHydrated && !hasStoredGoals && profile) {
      saveGoals(profile.goals.map(createGoalFromTitle));
    }
  }, [hasHydrated, hasStoredGoals, profile]);

  const completedGoals = goals.filter((goal) => goal.completed).length;
  const totalTasks = goals.reduce((count, goal) => count + goal.tasks.length, 0);
  const completedTasks = goals.reduce(
    (count, goal) =>
      count + goal.tasks.filter((task) => task.completed).length,
    0,
  );
  const visibleGoals = useMemo(
    () =>
      goals.filter((goal) => {
        if (filter === "active") return !goal.completed;
        if (filter === "complete") return goal.completed;
        return true;
      }),
    [filter, goals],
  );

  function saveGoalDraft(draft: GoalDraft) {
    const now = new Date().toISOString();
    if (editorGoal) {
      saveGoals(
        goals.map((goal) =>
          goal.id === editorGoal.id
            ? {
                ...goal,
                ...draft,
                deadline: draft.deadline || null,
                updatedAt: now,
              }
            : goal,
        ),
      );
    } else {
      saveGoals([
        {
          id: createId("goal"),
          title: draft.title,
          deadline: draft.deadline || null,
          priority: draft.priority,
          completed: false,
          tasks: draft.tasks,
          createdAt: now,
          updatedAt: now,
        },
        ...goals,
      ]);
    }
    setEditorGoal(undefined);
  }

  function toggleGoal(goalId: string) {
    const now = new Date().toISOString();
    saveGoals(
      goals.map((goal) =>
        goal.id === goalId
          ? { ...goal, completed: !goal.completed, updatedAt: now }
          : goal,
      ),
    );
  }

  function toggleTask(goalId: string, taskId: string) {
    const now = new Date().toISOString();
    saveGoals(
      goals.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              updatedAt: now,
              tasks: goal.tasks.map((task) =>
                task.id === taskId
                  ? { ...task, completed: !task.completed }
                  : task,
              ),
            }
          : goal,
      ),
    );
  }

  function deleteGoal() {
    if (!goalToDelete) return;
    saveGoals(goals.filter((goal) => goal.id !== goalToDelete.id));
    setGoalToDelete(null);
  }

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-[1380px]">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
              <Target className="size-4" />
              Your bigger picture
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              Goals worth showing up for.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Keep each goal clear, break it into small steps, and let progress
              build one task at a time.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setEditorGoal(null)}
            className="shadow-sm shadow-primary/20"
          >
            <Plus /> Add goal
          </Button>
        </section>

        <section aria-label="Goals overview" className="mt-7 grid gap-3 sm:grid-cols-3">
          <Card className="gap-3 border-0 py-4 shadow-none ring-1 ring-foreground/8">
            <CardContent className="flex items-center gap-3 px-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Target className="size-[18px]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active goals</p>
                <p className="mt-0.5 text-xl font-semibold tracking-tight">
                  {goals.length - completedGoals}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-3 border-0 py-4 shadow-none ring-1 ring-foreground/8">
            <CardContent className="flex items-center gap-3 px-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <Trophy className="size-[18px]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Goals completed</p>
                <p className="mt-0.5 text-xl font-semibold tracking-tight">
                  {completedGoals}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-3 border-0 py-4 shadow-none ring-1 ring-foreground/8">
            <CardContent className="flex items-center gap-3 px-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <ClipboardCheck className="size-[18px]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tasks completed</p>
                <p className="mt-0.5 text-xl font-semibold tracking-tight">
                  {completedTasks} <span className="text-sm text-muted-foreground">/ {totalTasks}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex rounded-xl border bg-card p-1 shadow-xs">
            {(["all", "active", "complete"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors sm:px-4",
                  filter === item
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item === "complete" ? "Completed" : item}
              </button>
            ))}
          </div>
          <p className="hidden text-xs text-muted-foreground sm:block">
            {visibleGoals.length} {visibleGoals.length === 1 ? "goal" : "goals"}
          </p>
        </div>

        {hasHydrated && visibleGoals.length > 0 ? (
          <section className="mt-4 grid items-start gap-4 xl:grid-cols-2">
            {visibleGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => setEditorGoal(goal)}
                onDelete={() => setGoalToDelete(goal)}
                onToggleGoal={() => toggleGoal(goal.id)}
                onToggleTask={(taskId) => toggleTask(goal.id, taskId)}
              />
            ))}
          </section>
        ) : null}

        {hasHydrated && visibleGoals.length === 0 ? (
          <section className="mt-4 flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 px-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              {filter === "complete" ? (
                <CheckCircle2 className="size-6" />
              ) : (
                <Target className="size-6" />
              )}
            </div>
            <h2 className="mt-5 text-lg font-semibold tracking-tight">
              {goals.length === 0
                ? "Start with one meaningful goal"
                : `No ${filter} goals yet`}
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              {goals.length === 0
                ? "Add a goal, give it a priority, and define a few concrete next steps."
                : "Your goals will appear here when their status changes."}
            </p>
            {goals.length === 0 ? (
              <Button className="mt-5" onClick={() => setEditorGoal(null)}>
                <Plus /> Create your first goal
              </Button>
            ) : null}
          </section>
        ) : null}

        {!hasHydrated ? (
          <section className="mt-4 grid gap-4 xl:grid-cols-2">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </section>
        ) : null}
      </div>

      {editorGoal !== undefined ? (
        <GoalEditor
          key={editorGoal?.id ?? "new-goal"}
          goal={editorGoal}
          onClose={() => setEditorGoal(undefined)}
          onSave={saveGoalDraft}
        />
      ) : null}

      <AlertDialog
        open={goalToDelete !== null}
        onOpenChange={(open) => !open && setGoalToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
            <AlertDialogDescription>
              “{goalToDelete?.title}” and all of its tasks will be permanently
              removed from this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep goal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={deleteGoal}>
              Delete goal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
