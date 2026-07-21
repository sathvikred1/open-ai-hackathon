"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import {
  ArrowRight,
  BatteryMedium,
  CalendarClock,
  Check,
  ChevronRight,
  CircleCheckBig,
  Clock3,
  Coffee,
  Flag,
  ListRestart,
  MoonStar,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Sunrise,
  Target,
  Timer,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { UserName } from "@/components/user-profile";
import { useDailyPlan } from "@/hooks/use-daily-plan";
import { useGoals } from "@/hooks/use-goals";
import {
  useHasHydrated,
  useOnboardingProfile,
} from "@/hooks/use-onboarding-profile";
import {
  createGoalsFromProfile,
  formatPlanTime,
  generateDailyPlan,
  getLocalDateKey,
  saveDailyPlan,
  ScheduleBlock,
} from "@/lib/daily-planner";
import { cn } from "@/lib/utils";

const priorityStyles = {
  high: "bg-rose-50 text-rose-700 ring-rose-600/10",
  medium: "bg-amber-50 text-amber-700 ring-amber-600/10",
  low: "bg-sky-50 text-sky-700 ring-sky-600/10",
};

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours} hr`;
}

function formatProfileTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return formatPlanTime(hours * 60 + minutes);
}

function ScheduleItem({
  block,
  current,
  onToggle,
}: {
  block: ScheduleBlock;
  current: boolean;
  onToggle: () => void;
}) {
  const duration = block.endMinutes - block.startMinutes;
  const isTask = block.kind === "task";
  const category = isTask
    ? block.focus
      ? "Focus"
      : "Goal task"
    : block.kind === "meal"
      ? "Break"
      : "Routine";

  return (
    <div className="group grid grid-cols-[58px_1fr] gap-3 sm:grid-cols-[76px_1fr] sm:gap-4">
      <div className="pt-1 text-right">
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {formatPlanTime(block.startMinutes).replace(/\s[AP]M$/, "")}
        </p>
        <p className="text-[10px] font-medium text-muted-foreground">
          {formatPlanTime(block.startMinutes).split(" ")[1]}
        </p>
      </div>

      <div
        className={cn(
          "relative mb-3 rounded-2xl border p-4 transition-all last:mb-0 sm:p-5",
          current
            ? "border-emerald-200 bg-emerald-50/70 shadow-sm shadow-emerald-950/5"
            : "border-border/70 bg-card hover:border-border hover:shadow-sm",
          block.completed && "bg-muted/35 opacity-70",
        )}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            checked={block.completed}
            onCheckedChange={onToggle}
            aria-label={`Mark ${block.title} ${block.completed ? "incomplete" : "complete"}`}
            className={cn("mt-0.5 size-[18px]", current && "border-emerald-500")}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={cn(
                  "font-semibold tracking-tight",
                  block.completed &&
                    "text-muted-foreground line-through decoration-muted-foreground/50",
                )}
              >
                {block.title}
              </p>
              {current ? (
                <Badge className="border-0 bg-emerald-600 text-[10px] text-white">
                  Up next
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground sm:text-sm">
              {block.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "border-0 ring-1",
                  isTask && block.priority
                    ? priorityStyles[block.priority]
                    : block.kind === "meal"
                      ? "bg-orange-50 text-orange-700 ring-orange-600/10"
                      : "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
                )}
              >
                {block.focus ? <Zap className="size-3" /> : null}
                {category}
              </Badge>
              <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <Clock3 className="size-3" />
                {formatDuration(duration)}
              </span>
              <span className="text-[11px] text-muted-foreground/70">
                until {formatPlanTime(block.endMinutes)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TodayPage() {
  const hasHydrated = useHasHydrated();
  const profile = useOnboardingProfile();
  const { goals, hasStoredGoals } = useGoals();
  const plan = useDailyPlan();
  const date = getLocalDateKey();
  const planningGoals = useMemo(
    () =>
      hasStoredGoals
        ? goals
        : profile
          ? createGoalsFromProfile(profile)
          : [],
    [goals, hasStoredGoals, profile],
  );

  useEffect(() => {
    if (hasHydrated && profile && plan?.date !== date) {
      saveDailyPlan(
        generateDailyPlan({ profile, goals: planningGoals, date }),
      );
    }
  }, [date, hasHydrated, plan?.date, planningGoals, profile]);

  function regeneratePlan() {
    if (!profile) return;
    saveDailyPlan(
      generateDailyPlan({
        profile,
        goals: planningGoals,
        date,
        previousPlan: plan,
      }),
    );
  }

  function toggleBlock(blockId: string) {
    if (!plan) return;
    saveDailyPlan({
      ...plan,
      blocks: plan.blocks.map((block) =>
        block.id === blockId
          ? { ...block, completed: !block.completed }
          : block,
      ),
    });
  }

  const blocks = plan?.date === date ? plan.blocks : [];
  const completedBlocks = blocks.filter((block) => block.completed).length;
  const progress = blocks.length
    ? Math.round((completedBlocks / blocks.length) * 100)
    : 0;
  const taskBlocks = blocks.filter((block) => block.kind === "task");
  const focusMinutes = taskBlocks
    .filter((block) => block.focus)
    .reduce(
      (minutes, block) => minutes + block.endMinutes - block.startMinutes,
      0,
    );
  const nextBlock = blocks.find((block) => !block.completed);
  const nextTask = taskBlocks.find((block) => !block.completed);
  const completedGoals = goals.filter((goal) => goal.completed).length;
  const goalProgress = goals.length
    ? Math.round((completedGoals / goals.length) * 100)
    : 0;

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-[1380px]">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
              <Sparkles className="size-4" />
              Built around your rhythm
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              Good morning, <UserName />.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {plan
                ? `Your day has ${blocks.length} realistic blocks, with your most important work protected.`
                : "We’re turning your goals and unfinished tasks into a realistic plan."}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/goals"
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-sm font-medium transition-colors hover:bg-muted sm:flex-none"
            >
              <Plus className="size-4" />
              Add tasks
            </Link>
            <Button
              size="lg"
              onClick={regeneratePlan}
              disabled={!plan}
              className="flex-1 shadow-sm shadow-primary/20 sm:flex-none"
            >
              <RefreshCw />
              Regenerate plan
            </Button>
          </div>
        </section>

        <section aria-label="Daily overview" className="mt-7 grid gap-3 sm:grid-cols-3">
          <Card className="gap-3 border-0 py-4 shadow-none ring-1 ring-foreground/8">
            <CardContent className="flex items-center gap-3 px-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Check className="size-[18px]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">Daily progress</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {completedBlocks} / {blocks.length}
                  </p>
                </div>
                <Progress
                  value={progress}
                  className="mt-2 [&_[data-slot=progress-indicator]]:bg-emerald-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="gap-3 border-0 py-4 shadow-none ring-1 ring-foreground/8">
            <CardContent className="flex items-center gap-3 px-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <Timer className="size-[18px]" />
              </div>
              <div>
                <p className="text-sm font-medium">Protected focus</p>
                <p className="mt-0.5 text-lg font-semibold tracking-tight">
                  {formatDuration(focusMinutes)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-3 border-0 py-4 shadow-none ring-1 ring-foreground/8">
            <CardContent className="flex items-center gap-3 px-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <BatteryMedium className="size-[18px]" />
              </div>
              <div>
                <p className="text-sm font-medium">Plan window</p>
                <p className="mt-0.5 text-lg font-semibold tracking-tight">
                  {profile
                    ? `${formatProfileTime(profile.wakeUpTime)} – ${formatProfileTime(profile.sleepTime)}`
                    : "Loading…"}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="gap-0 border-0 py-0 shadow-none ring-1 ring-foreground/8">
            <CardHeader className="border-b px-5 py-5 sm:px-6">
              <CardTitle className="text-lg font-semibold tracking-tight">
                Today&apos;s timetable
              </CardTitle>
              <CardDescription>
                {plan
                  ? `${taskBlocks.length} goal blocks · ${formatDuration(
                      taskBlocks.reduce(
                        (total, block) =>
                          total + block.endMinutes - block.startMinutes,
                        0,
                      ),
                    )} planned`
                  : "Generating your timetable…"}
              </CardDescription>
              <CardAction>
                <Badge variant="outline" className="bg-card">
                  <CalendarClock /> Deterministic plan
                </Badge>
              </CardAction>
            </CardHeader>

            {plan?.unscheduledCount ? (
              <div className="flex items-start gap-2 border-b bg-amber-50/70 px-5 py-3 text-xs text-amber-800 sm:px-6">
                <Flag className="mt-0.5 size-3.5 shrink-0" />
                {plan.unscheduledCount} unfinished {plan.unscheduledCount === 1 ? "task doesn’t" : "tasks don’t"} fit today. They stay safely in Goals for the next plan.
              </div>
            ) : null}

            <CardContent className="px-4 py-5 sm:px-6 sm:py-6">
              {blocks.length > 0 ? (
                blocks.map((block) => (
                  <ScheduleItem
                    key={block.id}
                    block={block}
                    current={nextBlock?.id === block.id}
                    onToggle={() => toggleBlock(block.id)}
                  />
                ))
              ) : (
                <div className="space-y-3">
                  {[0, 1, 2, 3].map((item) => (
                    <div key={item} className="flex gap-4">
                      <div className="h-9 w-16 animate-pulse rounded-lg bg-muted" />
                      <div className="h-24 flex-1 animate-pulse rounded-2xl bg-muted" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <aside className="space-y-5">
            <Card className="border-0 bg-emerald-950 text-white shadow-lg shadow-emerald-950/10 ring-0">
              <CardHeader>
                <div className="mb-4 flex items-center justify-between">
                  <Badge className="border-0 bg-white/10 text-emerald-100">
                    <span className="mr-1 size-1.5 rounded-full bg-emerald-300" />
                    {nextTask ? "Next focus" : "Today"}
                  </Badge>
                  {nextTask ? (
                    <span className="text-xs font-medium text-emerald-200/70">
                      {formatPlanTime(nextTask.startMinutes)}
                    </span>
                  ) : null}
                </div>
                <CardTitle className="text-lg font-semibold text-white">
                  {nextTask?.title || "You cleared the plan"}
                </CardTitle>
                <CardDescription className="text-emerald-100/65">
                  {nextTask
                    ? `${nextTask.description} · ${formatDuration(nextTask.endMinutes - nextTask.startMinutes)}`
                    : "Nice work. Everything scheduled for today is complete."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {nextTask ? (
                  <Button
                    variant="secondary"
                    onClick={() => toggleBlock(nextTask.id)}
                    className="w-full bg-white text-emerald-950 hover:bg-emerald-50"
                  >
                    <CircleCheckBig />
                    Mark block complete
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl bg-white/10 p-3 text-sm text-emerald-100">
                    <Check className="size-4" /> Today&apos;s plan is complete
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-none ring-1 ring-foreground/8">
              <CardHeader>
                <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <ListRestart className="size-[18px]" />
                </div>
                <CardTitle className="text-lg font-semibold">Planner inputs</CardTitle>
                <CardDescription>What shaped today&apos;s timetable.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Sunrise className="size-3.5 text-amber-600" /> Wake up
                  </span>
                  <span className="font-semibold">
                    {profile ? formatProfileTime(profile.wakeUpTime) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Zap className="size-3.5 text-violet-600" /> Focus hours
                  </span>
                  <span className="font-semibold">
                    {profile
                      ? `${formatProfileTime(profile.focusStartTime)} – ${formatProfileTime(profile.focusEndTime)}`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Target className="size-3.5 text-emerald-600" /> Active goals
                  </span>
                  <span className="font-semibold">
                    {planningGoals.filter((goal) => !goal.completed).length}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <MoonStar className="size-3.5 text-sky-600" /> Sleep
                  </span>
                  <span className="font-semibold">
                    {profile ? formatProfileTime(profile.sleepTime) : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-none ring-1 ring-foreground/8">
              <CardHeader>
                <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Coffee className="size-[18px]" />
                </div>
                <CardTitle className="text-lg font-semibold">Goal momentum</CardTitle>
                <CardDescription>Progress across your bigger goals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium">Goals completed</span>
                    <span className="font-semibold tabular-nums">{goalProgress}%</span>
                  </div>
                  <Progress
                    value={goalProgress}
                    className="[&_[data-slot=progress-indicator]]:bg-orange-500"
                  />
                </div>
                <Separator />
                <Link
                  href="/goals"
                  className="flex h-8 w-full items-center justify-between rounded-lg px-1 text-sm font-medium hover:text-primary"
                >
                  View goals
                  <ChevronRight className="size-4" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-violet-50 to-sky-50 shadow-none ring-1 ring-violet-900/8">
              <CardHeader>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-700">
                  <RotateCcw className="size-3.5" />
                  NEXT UP: ADAPTIVE REPLANNING
                </div>
                <CardTitle className="text-lg font-semibold">Plans changed?</CardTitle>
                <CardDescription className="leading-5">
                  For now, regenerate using the same local rules. AI tradeoff
                  reasoning comes next.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={regeneratePlan}
                  className="w-full justify-between bg-white/70"
                >
                  Rebuild today&apos;s plan
                  <ArrowRight />
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}
