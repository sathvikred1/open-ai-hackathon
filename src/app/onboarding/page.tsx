"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Goal,
  HeartHandshake,
  LockKeyhole,
  MoonStar,
  Sparkles,
  Sunrise,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useHasHydrated,
  useOnboardingProfile,
} from "@/hooks/use-onboarding-profile";
import {
  OnboardingProfile,
  saveOnboardingProfile,
} from "@/lib/onboarding";
import { cn } from "@/lib/utils";

const steps = [
  { label: "About you", icon: HeartHandshake },
  { label: "Your rhythm", icon: Clock3 },
  { label: "Your goals", icon: Goal },
];

const suggestedGoals = [
  "Ship the Brolife MVP",
  "Improve my health",
  "Learn consistently",
  "Grow my side hustle",
];

type OnboardingFormState = Pick<
  OnboardingProfile,
  | "name"
  | "wakeUpTime"
  | "sleepTime"
  | "focusStartTime"
  | "focusEndTime"
> & { goalsText: string };

const defaultFormState: OnboardingFormState = {
  name: "",
  wakeUpTime: "07:30",
  sleepTime: "00:30",
  focusStartTime: "09:00",
  focusEndTime: "12:00",
  goalsText: "",
};

function formatTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

function parseGoals(value: string) {
  return value
    .split("\n")
    .map((goal) => goal.trim())
    .filter(Boolean);
}

function OnboardingForm({
  initialProfile,
}: {
  initialProfile: OnboardingProfile | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [form, setForm] = useState<OnboardingFormState>(() =>
    initialProfile
      ? {
          name: initialProfile.name,
          wakeUpTime: initialProfile.wakeUpTime,
          sleepTime: initialProfile.sleepTime,
          focusStartTime: initialProfile.focusStartTime,
          focusEndTime: initialProfile.focusEndTime,
          goalsText: initialProfile.goals.join("\n"),
        }
      : defaultFormState,
  );

  const goals = parseGoals(form.goalsText);

  function updateField(field: keyof OnboardingFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function toggleSuggestedGoal(goal: string) {
    const currentGoals = parseGoals(form.goalsText);
    const nextGoals = currentGoals.includes(goal)
      ? currentGoals.filter((item) => item !== goal)
      : [...currentGoals, goal];
    updateField("goalsText", nextGoals.join("\n"));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step === 0 && form.name.trim().length < 2) {
      setError("Tell us the name you'd like Brolife to use.");
      return;
    }

    if (
      step === 1 &&
      (!form.wakeUpTime ||
        !form.sleepTime ||
        !form.focusStartTime ||
        !form.focusEndTime)
    ) {
      setError("Add all four times so Brolife can shape a realistic day.");
      return;
    }

    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      setError("");
      return;
    }

    if (goals.length === 0) {
      setError("Add at least one goal to start planning around.");
      return;
    }

    saveOnboardingProfile({
      version: 1,
      name: form.name.trim(),
      wakeUpTime: form.wakeUpTime,
      sleepTime: form.sleepTime,
      focusStartTime: form.focusStartTime,
      focusEndTime: form.focusEndTime,
      goals,
      completedAt: new Date().toISOString(),
    });
    router.replace("/");
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="relative hidden w-[42%] max-w-[620px] flex-col overflow-hidden bg-emerald-950 p-10 text-white lg:flex xl:p-14">
        <div className="absolute -right-28 -top-28 size-80 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="absolute -bottom-24 -left-24 size-72 rounded-full bg-sky-400/10 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-400 text-emerald-950">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">Brolife</p>
            <p className="text-xs text-emerald-100/55">Plan better. Live lighter.</p>
          </div>
        </div>

        <div className="relative my-auto max-w-lg py-12">
          <Badge className="mb-7 border border-white/10 bg-white/8 text-emerald-100">
            <Zap className="mr-1 size-3" />
            Built around your real life
          </Badge>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-[-0.04em] xl:text-5xl">
            A plan that bends,
            <br />
            so you don&apos;t break.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-emerald-100/65">
            Give Brolife a little context about your day. We&apos;ll use it to
            build schedules that feel achievable, not overwhelming.
          </p>

          <div className="mt-10 space-y-4">
            {[
              "Plans around your natural energy",
              "Protects the goals that matter most",
              "Adjusts when the day changes",
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 text-sm text-emerald-50/85">
                <span className="flex size-6 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                  <Check className="size-3.5" />
                </span>
                {benefit}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs leading-5 text-emerald-100/45">
          “You don&apos;t need a perfect day. You need a plan that can recover.”
        </p>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <span className="font-semibold tracking-tight">Brolife</span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <LockKeyhole className="size-3.5" />
            Saved only on this device
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-xl">
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Step {step + 1} of {steps.length}</span>
                <span>{steps[step].label}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                />
              </div>
              <div className="mt-5 hidden grid-cols-3 gap-2 sm:grid">
                {steps.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className={cn(
                        "flex items-center gap-2 text-xs font-medium",
                        index <= step ? "text-foreground" : "text-muted-foreground/55",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-6 items-center justify-center rounded-full",
                          index < step
                            ? "bg-primary text-primary-foreground"
                            : index === step
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {index < step ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                      </span>
                      {item.label}
                    </div>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {step === 0 ? (
                <section className="animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="mb-7 flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                    <HeartHandshake className="size-5" />
                  </div>
                  <h2 className="text-3xl font-semibold tracking-[-0.035em]">
                    What should we call you?
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                    Brolife should feel like a supportive friend, not another
                    corporate dashboard.
                  </p>
                  <div className="mt-8 space-y-2.5">
                    <Label htmlFor="name">Your name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      placeholder="e.g. Alex"
                      autoComplete="name"
                      autoFocus
                      className="h-12 rounded-xl bg-card px-4 text-base shadow-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      You can change this any time.
                    </p>
                  </div>
                </section>
              ) : null}

              {step === 1 ? (
                <section className="animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="mb-7 flex size-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-800">
                    <Clock3 className="size-5" />
                  </div>
                  <h2 className="text-3xl font-semibold tracking-[-0.035em]">
                    Shape your ideal day.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                    These anchors help us build a schedule that respects your
                    sleep and puts demanding work in the right window.
                  </p>

                  <div className="mt-8 grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2.5">
                      <Label htmlFor="wake-time" className="flex items-center gap-2">
                        <Sunrise className="size-4 text-amber-600" /> Wake-up time
                      </Label>
                      <Input
                        id="wake-time"
                        type="time"
                        value={form.wakeUpTime}
                        onChange={(event) => updateField("wakeUpTime", event.target.value)}
                        className="h-12 rounded-xl bg-card px-4 shadow-xs"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="sleep-time" className="flex items-center gap-2">
                        <MoonStar className="size-4 text-violet-600" /> Sleep time
                      </Label>
                      <Input
                        id="sleep-time"
                        type="time"
                        value={form.sleepTime}
                        onChange={(event) => updateField("sleepTime", event.target.value)}
                        className="h-12 rounded-xl bg-card px-4 shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="mt-7 rounded-2xl border bg-card p-4 shadow-xs sm:p-5">
                    <div className="mb-4">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <Zap className="size-4 text-emerald-600" /> Preferred focus hours
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        When do you usually feel best for focused, uninterrupted work?
                      </p>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="focus-start" className="text-xs text-muted-foreground">
                          From
                        </Label>
                        <Input
                          id="focus-start"
                          type="time"
                          value={form.focusStartTime}
                          onChange={(event) => updateField("focusStartTime", event.target.value)}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <span className="pb-3 text-xs text-muted-foreground">to</span>
                      <div className="space-y-2">
                        <Label htmlFor="focus-end" className="text-xs text-muted-foreground">
                          Until
                        </Label>
                        <Input
                          id="focus-end"
                          type="time"
                          value={form.focusEndTime}
                          onChange={(event) => updateField("focusEndTime", event.target.value)}
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              {step === 2 ? (
                <section className="animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="mb-7 flex size-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
                    <Goal className="size-5" />
                  </div>
                  <h2 className="text-3xl font-semibold tracking-[-0.035em]">
                    What matters most right now?
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                    Add a few goals. Brolife will use them to make better tradeoffs
                    when your day needs to change.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-2">
                    {suggestedGoals.map((goal) => {
                      const selected = goals.includes(goal);
                      return (
                        <Button
                          key={goal}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => toggleSuggestedGoal(goal)}
                          aria-pressed={selected}
                          className={cn(
                            "rounded-full bg-card",
                            selected && "border-emerald-300 bg-emerald-50 text-emerald-800",
                          )}
                        >
                          {selected ? <Check className="size-3.5" /> : null}
                          {goal}
                        </Button>
                      );
                    })}
                  </div>

                  <div className="mt-6 space-y-2.5">
                    <Label htmlFor="goals">Your main goals</Label>
                    <Textarea
                      id="goals"
                      value={form.goalsText}
                      onChange={(event) => updateField("goalsText", event.target.value)}
                      placeholder={"Finish my portfolio\nRun three times a week\nStudy React for 30 minutes daily"}
                      className="min-h-36 resize-none rounded-xl bg-card px-4 py-3 leading-7 shadow-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Add one goal per line · {goals.length} added
                    </p>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-muted/60 p-4 text-xs">
                    <div>
                      <p className="text-muted-foreground">Daily rhythm</p>
                      <p className="mt-1 font-semibold">
                        {formatTime(form.wakeUpTime)} – {formatTime(form.sleepTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Focus window</p>
                      <p className="mt-1 font-semibold">
                        {formatTime(form.focusStartTime)} – {formatTime(form.focusEndTime)}
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}

              <div className="mt-7 min-h-5" aria-live="polite">
                {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => {
                    setStep((current) => Math.max(0, current - 1));
                    setError("");
                  }}
                  disabled={step === 0}
                  className={cn(step === 0 && "invisible")}
                >
                  <ArrowLeft /> Back
                </Button>
                <Button type="submit" size="lg" className="min-w-36 shadow-sm shadow-primary/20">
                  {step === steps.length - 1 ? (
                    <>
                      Finish setup <Check />
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  const hasHydrated = useHasHydrated();
  const profile = useOnboardingProfile();

  if (!hasHydrated) {
    return <div className="min-h-dvh bg-background" />;
  }

  return (
    <OnboardingForm
      key={profile?.completedAt ?? "new-profile"}
      initialProfile={profile}
    />
  );
}
