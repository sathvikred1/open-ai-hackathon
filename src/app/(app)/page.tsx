import {
  ArrowRight,
  BatteryMedium,
  CalendarClock,
  Check,
  ChevronRight,
  CirclePlay,
  Clock3,
  Flame,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Sparkles,
  Timer,
  WandSparkles,
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
import { cn } from "@/lib/utils";

const schedule = [
  {
    time: "8:00",
    meridiem: "AM",
    title: "Morning movement",
    description: "Strength session and a quick stretch",
    category: "Health",
    duration: "30 min",
    status: "complete",
  },
  {
    time: "9:00",
    meridiem: "AM",
    title: "Brolife product brief",
    description: "Define the MVP story and demo flow",
    category: "Work",
    duration: "90 min",
    status: "complete",
  },
  {
    time: "11:00",
    meridiem: "AM",
    title: "Review Server Components",
    description: "Focus block · 38 minutes remaining",
    category: "Learning",
    duration: "60 min",
    status: "current",
  },
  {
    time: "1:00",
    meridiem: "PM",
    title: "Lunch and reset",
    description: "Step away from the desk",
    category: "Health",
    duration: "45 min",
    status: "upcoming",
  },
  {
    time: "2:00",
    meridiem: "PM",
    title: "Build the Today experience",
    description: "App shell, schedule, and progress cards",
    category: "Work",
    duration: "2 hr",
    status: "upcoming",
  },
  {
    time: "8:30",
    meridiem: "PM",
    title: "Side hustle focus block",
    description: "Ship one meaningful improvement",
    category: "Side hustle",
    duration: "90 min",
    status: "upcoming",
  },
];

const categoryStyles: Record<string, string> = {
  Health: "bg-rose-50 text-rose-700 ring-rose-600/10",
  Work: "bg-sky-50 text-sky-700 ring-sky-600/10",
  Learning: "bg-violet-50 text-violet-700 ring-violet-600/10",
  "Side hustle": "bg-amber-50 text-amber-700 ring-amber-600/10",
};

function ScheduleItem({ item }: { item: (typeof schedule)[number] }) {
  const isComplete = item.status === "complete";
  const isCurrent = item.status === "current";

  return (
    <div className="group grid grid-cols-[52px_1fr] gap-3 sm:grid-cols-[64px_1fr] sm:gap-4">
      <div className="pt-1 text-right">
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {item.time}
        </p>
        <p className="text-[10px] font-medium text-muted-foreground">
          {item.meridiem}
        </p>
      </div>

      <div
        className={cn(
          "relative mb-3 rounded-2xl border p-4 transition-all last:mb-0 sm:p-5",
          isCurrent
            ? "border-emerald-200 bg-emerald-50/70 shadow-sm shadow-emerald-950/5"
            : "border-border/70 bg-card hover:border-border hover:shadow-sm",
        )}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            defaultChecked={isComplete}
            aria-label={`Mark ${item.title} complete`}
            className={cn("mt-0.5 size-[18px]", isCurrent && "border-emerald-500")}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={cn(
                  "font-semibold tracking-tight",
                  isComplete && "text-muted-foreground line-through decoration-muted-foreground/50",
                )}
              >
                {item.title}
              </p>
              {isCurrent ? (
                <Badge className="border-0 bg-emerald-600 text-[10px] text-white">
                  In progress
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
              {item.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn("border-0 ring-1", categoryStyles[item.category])}
              >
                {item.category}
              </Badge>
              <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <Clock3 className="size-3" />
                {item.duration}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`More options for ${item.title}`}
            className="-mr-1 -mt-1 opacity-60 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <MoreHorizontal />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TodayPage() {
  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-[1380px]">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
              <Sparkles className="size-4" />
              You&apos;re making good progress
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              Good morning, <UserName />.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Here&apos;s your plan for today. Two tasks are already done, and your
              next focus block is underway.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="lg" className="flex-1 bg-card sm:flex-none">
              <Plus />
              Add task
            </Button>
            <Button size="lg" className="flex-1 shadow-sm shadow-primary/20 sm:flex-none">
              <WandSparkles />
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
                  <p className="text-sm font-semibold tabular-nums">2 / 6</p>
                </div>
                <Progress value={33} className="mt-2 [&_[data-slot=progress-indicator]]:bg-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="gap-3 border-0 py-4 shadow-none ring-1 ring-foreground/8">
            <CardContent className="flex items-center gap-3 px-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <Timer className="size-[18px]" />
              </div>
              <div>
                <p className="text-sm font-medium">Focus time</p>
                <p className="mt-0.5 text-lg font-semibold tracking-tight">3h 30m</p>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-3 border-0 py-4 shadow-none ring-1 ring-foreground/8">
            <CardContent className="flex items-center gap-3 px-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <BatteryMedium className="size-[18px]" />
              </div>
              <div>
                <p className="text-sm font-medium">Energy check</p>
                <p className="mt-0.5 text-lg font-semibold tracking-tight">Steady</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="gap-0 border-0 py-0 shadow-none ring-1 ring-foreground/8">
            <CardHeader className="border-b px-5 py-5 sm:px-6">
              <CardTitle className="text-lg font-semibold tracking-tight">
                Today&apos;s schedule
              </CardTitle>
              <CardDescription>6 tasks · 6 hours 35 minutes planned</CardDescription>
              <CardAction>
                <Button variant="ghost" size="sm">
                  <CalendarClock />
                  Timeline
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="px-4 py-5 sm:px-6 sm:py-6">
              {schedule.map((item) => (
                <ScheduleItem key={`${item.time}-${item.title}`} item={item} />
              ))}
            </CardContent>
          </Card>

          <aside className="space-y-5">
            <Card className="border-0 bg-emerald-950 text-white shadow-lg shadow-emerald-950/10 ring-0">
              <CardHeader>
                <div className="mb-4 flex items-center justify-between">
                  <Badge className="border-0 bg-white/10 text-emerald-100">
                    <span className="mr-1 size-1.5 animate-pulse rounded-full bg-emerald-300" />
                    Focus now
                  </Badge>
                  <span className="text-xs font-medium text-emerald-200/70">11:00 AM</span>
                </div>
                <CardTitle className="text-lg font-semibold text-white">
                  Review Server Components
                </CardTitle>
                <CardDescription className="text-emerald-100/65">
                  Learning · 38 minutes remaining
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress
                  value={37}
                  className="[&_[data-slot=progress-indicator]]:bg-emerald-300 [&_[data-slot=progress-track]]:bg-white/10"
                />
                <Button
                  variant="secondary"
                  className="mt-5 w-full bg-white text-emerald-950 hover:bg-emerald-50"
                >
                  <CirclePlay />
                  Open focus mode
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-none ring-1 ring-foreground/8">
              <CardHeader>
                <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Flame className="size-[18px]" />
                </div>
                <CardTitle className="text-lg font-semibold">This week</CardTitle>
                <CardDescription>Small wins are adding up.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium">Weekly goals</span>
                    <span className="font-semibold tabular-nums">68%</span>
                  </div>
                  <Progress
                    value={68}
                    className="[&_[data-slot=progress-indicator]]:bg-orange-500"
                  />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/60 p-3">
                    <p className="text-xl font-semibold tracking-tight">12</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Tasks done</p>
                  </div>
                  <div className="rounded-xl bg-muted/60 p-3">
                    <p className="text-xl font-semibold tracking-tight">4 days</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Current streak</p>
                  </div>
                </div>
                <Button variant="ghost" className="w-full justify-between px-1">
                  View progress
                  <ChevronRight />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-violet-50 to-sky-50 shadow-none ring-1 ring-violet-900/8">
              <CardHeader>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-700">
                  <RotateCcw className="size-3.5" />
                  ADAPTIVE REPLANNING
                </div>
                <CardTitle className="text-lg font-semibold">
                  Plans changed?
                </CardTitle>
                <CardDescription className="leading-5">
                  Tell Brolife what happened. We&apos;ll protect what matters and
                  rebuild the rest of your day.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full justify-between bg-white/70">
                  Replan with Brolife
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
