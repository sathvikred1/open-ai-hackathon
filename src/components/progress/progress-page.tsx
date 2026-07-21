"use client";

import { useEffect, useMemo } from "react";
import {
  CalendarCheck2,
  Check,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Flame,
  Target,
  Trophy,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDailyPlan } from "@/hooks/use-daily-plan";
import { useGoals } from "@/hooks/use-goals";
import { useProgressHistory } from "@/hooks/use-progress-history";
import { getLocalDateKey } from "@/lib/daily-planner";
import {
  getTrailingWeek,
  recordDailyProgress,
} from "@/lib/progress-history";
import { cn } from "@/lib/utils";

function percentage(completed: number, total: number) {
  return total ? Math.round((completed / total) * 100) : 0;
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function ProgressPage() {
  const { goals } = useGoals();
  const plan = useDailyPlan();
  const history = useProgressHistory();
  const todayKey = getLocalDateKey();
  const todayPlan = plan?.date === todayKey ? plan : null;

  useEffect(() => {
    if (todayPlan) recordDailyProgress(todayPlan);
  }, [todayPlan]);

  const allTasks = goals.flatMap((goal) =>
    goal.tasks.map((task) => ({ ...task, goalTitle: goal.title })),
  );
  const completedTasks = allTasks.filter((task) => task.completed);
  const completedGoals = goals.filter((goal) => goal.completed).length;
  const completedBlocks =
    todayPlan?.blocks.filter((block) => block.completed).length ?? 0;
  const totalBlocks = todayPlan?.blocks.length ?? 0;

  const week = useMemo(() => {
    const byDate = new Map(history.map((day) => [day.date, day]));
    return getTrailingWeek().map((day) => {
      const snapshot = byDate.get(day.date);
      return {
        ...day,
        snapshot,
        completion: snapshot
          ? percentage(snapshot.completedBlocks, snapshot.totalBlocks)
          : 0,
      };
    });
  }, [history]);
  const recordedDays = week.filter((day) => day.snapshot);
  const weeklyCompleted = recordedDays.reduce(
    (total, day) => total + (day.snapshot?.completedBlocks ?? 0),
    0,
  );
  const weeklyPlanned = recordedDays.reduce(
    (total, day) => total + (day.snapshot?.totalBlocks ?? 0),
    0,
  );
  const weeklyFocusMinutes = recordedDays.reduce(
    (total, day) => total + (day.snapshot?.completedFocusMinutes ?? 0),
    0,
  );
  const weeklyCompletion = percentage(weeklyCompleted, weeklyPlanned);

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-[1380px]">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
              <Trophy className="size-4" />
              Small wins add up
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              Your progress
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              A clear view of what you&apos;ve finished and where to keep moving.
            </p>
          </div>
          <Badge variant="outline" className="w-fit bg-card px-3 py-1.5">
            <CalendarCheck2 className="size-3.5" /> Last 7 days
          </Badge>
        </section>

        <section
          aria-label="Progress overview"
          className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          <SummaryCard
            icon={CheckCircle2}
            label="Tasks completed"
            value={`${completedTasks.length} / ${allTasks.length}`}
            detail={`${percentage(completedTasks.length, allTasks.length)}% of goal tasks`}
            color="emerald"
          />
          <SummaryCard
            icon={Target}
            label="Goals completed"
            value={`${completedGoals} / ${goals.length}`}
            detail={`${goals.length - completedGoals} still active`}
            color="violet"
          />
          <SummaryCard
            icon={CalendarCheck2}
            label="Today’s plan"
            value={`${percentage(completedBlocks, totalBlocks)}%`}
            detail={`${completedBlocks} of ${totalBlocks} blocks complete`}
            color="sky"
          />
          <SummaryCard
            icon={Flame}
            label="Weekly completion"
            value={`${weeklyCompletion}%`}
            detail={`${recordedDays.length} recorded ${recordedDays.length === 1 ? "day" : "days"}`}
            color="amber"
          />
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]">
          <Card className="border-0 shadow-none ring-1 ring-foreground/8">
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-semibold tracking-tight">
                Weekly summary
              </CardTitle>
              <CardDescription>
                Daily plan completion for the trailing seven days.
              </CardDescription>
              <CardAction>
                <Badge className="border-0 bg-emerald-50 text-emerald-700">
                  {weeklyCompleted} blocks done
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="grid h-56 grid-cols-7 items-end gap-2 sm:gap-4">
                {week.map((day) => {
                  const isToday = day.date === todayKey;
                  const hasData = Boolean(day.snapshot);
                  return (
                    <div
                      key={day.date}
                      className="flex h-full min-w-0 flex-col items-center justify-end gap-2"
                      title={
                        hasData
                          ? `${day.dateLabel}: ${day.completion}% complete`
                          : `${day.dateLabel}: no plan recorded`
                      }
                    >
                      <span className="text-[10px] font-semibold tabular-nums text-muted-foreground sm:text-xs">
                        {hasData ? `${day.completion}%` : "—"}
                      </span>
                      <div className="relative h-36 w-full max-w-12 overflow-hidden rounded-xl bg-muted/70">
                        {hasData ? (
                          <div
                            className={cn(
                              "absolute inset-x-0 bottom-0 min-h-1 rounded-xl transition-all",
                              isToday ? "bg-emerald-600" : "bg-emerald-300",
                            )}
                            style={{ height: `${day.completion}%` }}
                          />
                        ) : (
                          <div className="absolute inset-x-2 bottom-2 top-2 rounded-lg border border-dashed border-foreground/10" />
                        )}
                      </div>
                      <div className="text-center">
                        <p
                          className={cn(
                            "text-xs font-semibold",
                            isToday && "text-emerald-700",
                          )}
                        >
                          {day.dayLabel}
                        </p>
                        <p className="hidden text-[10px] text-muted-foreground sm:block">
                          {day.dateLabel}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-3">
                <WeeklyStat label="Recorded days" value={`${recordedDays.length} / 7`} />
                <WeeklyStat label="Blocks completed" value={`${weeklyCompleted}`} />
                <WeeklyStat label="Focus completed" value={formatMinutes(weeklyFocusMinutes)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-none ring-1 ring-foreground/8">
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-semibold tracking-tight">
                Goal progress
              </CardTitle>
              <CardDescription>
                Task-level progress across your goals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {goals.length ? (
                goals.map((goal) => {
                  const tasksDone = goal.tasks.filter(
                    (task) => task.completed,
                  ).length;
                  const goalProgress = goal.completed
                    ? 100
                    : percentage(tasksDone, goal.tasks.length);
                  return (
                    <div key={goal.id}>
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {goal.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {goal.tasks.length
                              ? `${tasksDone} of ${goal.tasks.length} tasks`
                              : "No tasks added yet"}
                          </p>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">
                          {goalProgress}%
                        </span>
                      </div>
                      <Progress
                        value={goalProgress}
                        className={cn(
                          "[&_[data-slot=progress-indicator]]:bg-violet-500",
                          goal.completed &&
                            "[&_[data-slot=progress-indicator]]:bg-emerald-600",
                        )}
                      />
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  icon={Target}
                  title="No goals to measure yet"
                  description="Add a goal and a few tasks to start seeing progress here."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-5 border-0 shadow-none ring-1 ring-foreground/8">
          <CardHeader className="border-b">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Completed tasks
            </CardTitle>
            <CardDescription>
              The goal tasks you&apos;ve checked off so far.
            </CardDescription>
            <CardAction>
              <Badge variant="outline" className="bg-card">
                {completedTasks.length} total
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            {completedTasks.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4"
                  >
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <Check className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold line-through decoration-emerald-700/30">
                        {task.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {task.goalTitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CircleDashed}
                title="Your first win will appear here"
                description="Complete a task from Goals and this list will update automatically."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

const colorStyles = {
  emerald: "bg-emerald-50 text-emerald-700",
  violet: "bg-violet-50 text-violet-700",
  sky: "bg-sky-50 text-sky-700",
  amber: "bg-amber-50 text-amber-700",
};

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  color,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
  detail: string;
  color: keyof typeof colorStyles;
}) {
  return (
    <Card className="gap-3 border-0 py-4 shadow-none ring-1 ring-foreground/8">
      <CardContent className="flex items-center gap-3 px-4">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            colorStyles[color],
          )}
        >
          <Icon className="size-[18px]" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-muted/55 p-3">
      <Clock3 className="size-3.5 text-emerald-700" />
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Target;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed p-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-[18px]" />
      </div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
