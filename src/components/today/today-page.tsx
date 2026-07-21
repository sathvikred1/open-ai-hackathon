"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
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
  MessageSquareWarning,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
  replanDailySchedule,
  saveDailyPlan,
  ScheduleBlock,
} from "@/lib/daily-planner";
import { interpretDisruption } from "@/lib/replanning-client";
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
          block.completed && "border-dashed bg-muted/35",
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
                <Badge className="border-0 bg-emerald-700 text-[10px] text-white">
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
              <span className="text-[11px] text-muted-foreground">
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
  const [replanOpen, setReplanOpen] = useState(false);
  const [disruption, setDisruption] = useState("");
  const [replanError, setReplanError] = useState("");
  const [isReplanning, setIsReplanning] = useState(false);
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

  async function applyReplan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!plan) return;
    if (disruption.trim().length < 4) {
      setReplanError("Tell Brolife a little more about what changed.");
      return;
    }

    setIsReplanning(true);
    setReplanError("");

    try {
      const report = disruption.trim();
      const interpretation = await interpretDisruption(report);
      const now = new Date();
      saveDailyPlan(
        replanDailySchedule({
          plan,
          report,
          instructions: interpretation.instructions,
          interpretationSource: interpretation.source,
          fallbackReason: interpretation.fallbackReason,
          nowMinutes: now.getHours() * 60 + now.getMinutes(),
        }),
      );
      setReplanOpen(false);
      setDisruption("");
    } catch {
      setReplanError("Brolife couldn’t rebuild the plan. Please try again.");
    } finally {
      setIsReplanning(false);
    }
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
              variant="outline"
              size="lg"
              onClick={regeneratePlan}
              disabled={!plan}
              className="hidden bg-card sm:inline-flex"
            >
              <RefreshCw />
              Regenerate
            </Button>
            <Button
              size="lg"
              onClick={() => setReplanOpen(true)}
              disabled={!plan}
              className="flex-1 shadow-sm shadow-primary/20 sm:flex-none"
            >
              <MessageSquareWarning />
              Replan my day
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
                  aria-label="Daily plan completion"
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

            {plan?.lastReplan ? (
              <div className="border-b bg-gradient-to-r from-emerald-50/80 to-sky-50/60 px-5 py-5 sm:px-6">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                    <ListRestart className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-emerald-950">
                          Your plan was updated
                        </p>
                        <p className="mt-0.5 text-xs text-emerald-900/60">
                          “{plan.lastReplan.report}”
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="border-0 bg-white/70 text-emerald-800 shadow-xs">
                          {plan.lastReplan.interpretationSource === "openai"
                            ? "AI interpreted"
                            : "Local fallback"}
                        </Badge>
                        <Badge className="border-0 bg-white/70 text-emerald-800 shadow-xs">
                          {plan.lastReplan.changes.length} changes
                        </Badge>
                      </div>
                    </div>

                    {plan.lastReplan.fallbackReason ? (
                      <p className="mt-3 rounded-xl bg-white/65 px-3 py-2.5 text-xs leading-5 text-emerald-950/70 ring-1 ring-emerald-900/5">
                        {plan.lastReplan.fallbackReason}
                      </p>
                    ) : null}

                    <div className="mt-4 space-y-2">
                      {plan.lastReplan.changes.length > 0 ? (
                        plan.lastReplan.changes.map((change) => (
                          <div
                            key={`${change.blockId}-${change.type}`}
                            className="flex items-start gap-2 rounded-xl bg-white/65 px-3 py-2.5 text-xs ring-1 ring-emerald-900/5"
                          >
                            <span
                              className={cn(
                                "mt-1 size-1.5 shrink-0 rounded-full",
                                change.type === "removed"
                                  ? "bg-rose-500"
                                  : change.type === "added"
                                    ? "bg-violet-500"
                                    : "bg-emerald-500",
                              )}
                            />
                            <span>
                              <strong className="font-semibold text-foreground">
                                {change.title}:
                              </strong>{" "}
                              <span className="leading-5 text-muted-foreground">
                                {change.detail}
                              </span>
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-xl bg-white/65 px-3 py-2.5 text-xs text-muted-foreground">
                          The remaining blocks already fit, so no times needed to change.
                        </p>
                      )}
                    </div>

                    <details className="mt-3 text-xs text-emerald-950/70">
                      <summary className="cursor-pointer font-semibold">
                        Why Brolife made these choices
                      </summary>
                      <ul className="mt-2 space-y-1.5 pl-4">
                        {plan.lastReplan.explanation.map((item) => (
                          <li key={item} className="list-disc leading-5">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                </div>
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

          <aside aria-label="Today insights" className="space-y-5">
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
                    aria-label="Goal completion"
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
                  ADAPTIVE REPLANNING
                </div>
                <CardTitle className="text-lg font-semibold">Plans changed?</CardTitle>
                <CardDescription className="leading-5">
                  Explain what changed naturally. AI interprets it when available,
                  then Brolife&apos;s local engine safely rebuilds your timetable.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => setReplanOpen(true)}
                  className="w-full justify-between bg-white/70"
                >
                  Report a disruption
                  <ArrowRight />
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      <Dialog open={replanOpen} onOpenChange={setReplanOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={applyReplan}>
            <DialogHeader className="pr-8">
              <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-violet-100 text-violet-800">
                <MessageSquareWarning className="size-[18px]" />
              </div>
              <DialogTitle className="text-lg font-semibold">
                What changed?
              </DialogTitle>
              <DialogDescription className="leading-5">
                Tell Brolife what happened in plain language. AI interprets it
                when available, then local rules rebuild only the unfinished day.
              </DialogDescription>
            </DialogHeader>

            <div className="py-5">
              <Textarea
                value={disruption}
                onChange={(event) => {
                  setDisruption(event.target.value);
                  setReplanError("");
                }}
                placeholder="e.g. I’m running 2 hours late and feeling tired."
                aria-label="Describe what changed"
                maxLength={1000}
                autoFocus
                disabled={isReplanning}
                className="min-h-28 resize-none rounded-xl px-4 py-3 leading-6"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  "I’m running 2 hours late",
                  "I missed my workout",
                  "I feel tired",
                  "I only have 90 minutes left",
                ].map((example) => (
                  <button
                    key={example}
                    type="button"
                    disabled={isReplanning}
                    onClick={() => {
                      setDisruption(example);
                      setReplanError("");
                    }}
                    className="rounded-full border bg-background px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-emerald-50 hover:text-foreground"
                  >
                    {example}
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-muted/60 p-4">
                <p className="text-xs font-semibold">What stays safe</p>
                <ul className="mt-2 space-y-2 text-xs leading-5 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                    Completed blocks keep their exact times and status.
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                    Sleep and future meal anchors remain protected.
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                    Anything that cannot fit is clearly deferred, not lost.
                  </li>
                </ul>
              </div>

              <div className="mt-3 min-h-5" aria-live="polite">
                {replanError ? (
                  <p className="text-sm font-medium text-destructive">
                    {replanError}
                  </p>
                ) : null}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setReplanOpen(false)}
                disabled={isReplanning}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isReplanning}>
                {isReplanning ? (
                  <RefreshCw className="animate-spin" />
                ) : (
                  <ListRestart />
                )}
                {isReplanning ? "Understanding change…" : "Rebuild remaining day"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
