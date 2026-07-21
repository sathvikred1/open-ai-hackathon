"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Check,
  Clock3,
  HeartPulse,
  MoonStar,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sunrise,
  Target,
  Trash2,
  UserRound,
  Zap,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useHasHydrated,
  useOnboardingProfile,
} from "@/hooks/use-onboarding-profile";
import { resetBrolifeAppData } from "@/lib/app-data";
import {
  NightFocusPreference,
  OnboardingProfile,
  saveOnboardingProfile,
} from "@/lib/onboarding";
import { cn } from "@/lib/utils";

type ProfileFormState = {
  name: string;
  wakeUpTime: string;
  sleepTime: string;
  focusStartTime: string;
  focusEndTime: string;
  goalsText: string;
  nightFocusPreference: NightFocusPreference;
};

const nightFocusOptions: Array<{
  value: NightFocusPreference;
  title: string;
  description: string;
  icon: typeof Sparkles;
}> = [
  {
    value: "alternating",
    title: "Alternate automatically",
    description: "Side hustle Sun, Mon, Wed, Fri · Health Tue, Thu, Sat",
    icon: Sparkles,
  },
  {
    value: "side-hustle",
    title: "Side hustle",
    description: "Keep evening focus aimed at building and creating",
    icon: Zap,
  },
  {
    value: "health",
    title: "Health",
    description: "Keep evening focus aimed at movement and recovery",
    icon: HeartPulse,
  },
];

function toFormState(profile: OnboardingProfile): ProfileFormState {
  return {
    name: profile.name,
    wakeUpTime: profile.wakeUpTime,
    sleepTime: profile.sleepTime,
    focusStartTime: profile.focusStartTime,
    focusEndTime: profile.focusEndTime,
    goalsText: profile.goals.join("\n"),
    nightFocusPreference: profile.nightFocusPreference ?? "alternating",
  };
}

function parseGoals(value: string) {
  return value
    .split("\n")
    .map((goal) => goal.trim())
    .filter(Boolean);
}

export function ProfilePage() {
  const hasHydrated = useHasHydrated();
  const profile = useOnboardingProfile();

  if (!hasHydrated || !profile) {
    return (
      <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-5">
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="h-[560px] animate-pulse rounded-2xl bg-muted" />
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </main>
    );
  }

  return <ProfileForm key={profile.completedAt} profile={profile} />;
}

function ProfileForm({ profile }: { profile: OnboardingProfile }) {
  const initialForm = useMemo(() => toFormState(profile), [profile]);
  const [form, setForm] = useState<ProfileFormState>(initialForm);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const goals = parseGoals(form.goalsText);
  const hasChanges = JSON.stringify(form) !== JSON.stringify(initialForm);

  function updateField<K extends keyof ProfileFormState>(
    field: K,
    value: ProfileFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSaved(false);
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setError("Add the name you’d like Brolife to use.");
      return;
    }
    if (
      !form.wakeUpTime ||
      !form.sleepTime ||
      !form.focusStartTime ||
      !form.focusEndTime
    ) {
      setError("Add all four times so Brolife can plan around your rhythm.");
      return;
    }
    if (!goals.length) {
      setError("Keep at least one main goal in your planning preferences.");
      return;
    }

    const normalizedForm = {
      ...form,
      name: form.name.trim(),
      goalsText: goals.join("\n"),
    };
    saveOnboardingProfile({
      ...profile,
      name: normalizedForm.name,
      wakeUpTime: form.wakeUpTime,
      sleepTime: form.sleepTime,
      focusStartTime: form.focusStartTime,
      focusEndTime: form.focusEndTime,
      goals,
      nightFocusPreference: form.nightFocusPreference,
    });
    setForm(normalizedForm);
    setSaved(true);
  }

  function resetApp() {
    resetBrolifeAppData();
    window.location.replace("/onboarding");
  }

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
            <Settings2 className="size-4" />
            Make Brolife feel like yours
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Profile & preferences
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Update the daily anchors and priorities Brolife uses to shape your plan.
          </p>
        </section>

        <form
          onSubmit={saveProfile}
          className="mt-7 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
          <div className="space-y-5">
            <Card className="border-0 shadow-none ring-1 ring-foreground/8">
              <CardHeader className="border-b">
                <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <UserRound className="size-[18px]" />
                </div>
                <CardTitle className="text-lg font-semibold">About you</CardTitle>
                <CardDescription>
                  How Brolife addresses you across the app.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-w-md space-y-2">
                  <Label htmlFor="profile-name">Your name</Label>
                  <Input
                    id="profile-name"
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    autoComplete="name"
                    className="h-11 rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-none ring-1 ring-foreground/8">
              <CardHeader className="border-b">
                <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <Clock3 className="size-[18px]" />
                </div>
                <CardTitle className="text-lg font-semibold">Daily rhythm</CardTitle>
                <CardDescription>
                  Your sleep boundary and strongest focus window.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <TimeField
                    id="profile-wake"
                    label="Wake-up time"
                    icon={Sunrise}
                    value={form.wakeUpTime}
                    onChange={(value) => updateField("wakeUpTime", value)}
                    iconClassName="text-amber-600"
                  />
                  <TimeField
                    id="profile-sleep"
                    label="Sleep time"
                    icon={MoonStar}
                    value={form.sleepTime}
                    onChange={(value) => updateField("sleepTime", value)}
                    iconClassName="text-violet-600"
                  />
                </div>
                <div className="rounded-2xl bg-muted/55 p-4 sm:p-5">
                  <p className="mb-4 flex items-center gap-2 text-sm font-semibold">
                    <Zap className="size-4 text-emerald-600" /> Preferred focus hours
                  </p>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                    <TimeField
                      id="profile-focus-start"
                      label="From"
                      value={form.focusStartTime}
                      onChange={(value) => updateField("focusStartTime", value)}
                      compact
                    />
                    <span className="pb-3 text-xs text-muted-foreground">to</span>
                    <TimeField
                      id="profile-focus-end"
                      label="Until"
                      value={form.focusEndTime}
                      onChange={(value) => updateField("focusEndTime", value)}
                      compact
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-none ring-1 ring-foreground/8">
              <CardHeader className="border-b">
                <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                  <Target className="size-[18px]" />
                </div>
                <CardTitle className="text-lg font-semibold">
                  Planning preferences
                </CardTitle>
                <CardDescription>
                  The priorities Brolife should keep in mind.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="profile-goals">Main goals</Label>
                  <Textarea
                    id="profile-goals"
                    value={form.goalsText}
                    onChange={(event) =>
                      updateField("goalsText", event.target.value)
                    }
                    placeholder={"Ship my project\nImprove my health\nLearn consistently"}
                    className="min-h-28 resize-none rounded-xl px-4 py-3"
                  />
                  <p className="text-xs text-muted-foreground">
                    One goal per line. Detailed goals and tasks still live on the Goals page.
                  </p>
                </div>

                <div>
                  <Label>Evening focus</Label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {nightFocusOptions.map((option) => {
                      const Icon = option.icon;
                      const selected =
                        form.nightFocusPreference === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() =>
                            updateField("nightFocusPreference", option.value)
                          }
                          className={cn(
                            "rounded-2xl border p-4 text-left transition-colors",
                            selected
                              ? "border-emerald-300 bg-emerald-50 ring-1 ring-emerald-200"
                              : "bg-card hover:bg-muted/50",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <Icon
                              className={cn(
                                "size-4",
                                selected
                                  ? "text-emerald-700"
                                  : "text-muted-foreground",
                              )}
                            />
                            {selected ? (
                              <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                                <Check className="size-3" />
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-3 text-xs font-semibold">
                            {option.title}
                          </p>
                          <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                            {option.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <Card className="border-0 bg-emerald-950 text-white shadow-lg shadow-emerald-950/10">
              <CardContent className="space-y-4 px-5">
                <div className="flex items-center justify-between">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-white/10">
                    <ShieldCheck className="size-[18px] text-emerald-200" />
                  </div>
                  <Badge className="border-0 bg-white/10 text-emerald-100">
                    Local only
                  </Badge>
                </div>
                <div>
                  <p className="font-semibold">Your profile stays here</p>
                  <p className="mt-1 text-xs leading-5 text-emerald-100/65">
                    These settings are saved in this browser&apos;s localStorage.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-none ring-1 ring-foreground/8">
              <CardContent className="space-y-3 px-5">
                <Button
                  type="submit"
                  size="lg"
                  disabled={!hasChanges}
                  className="w-full"
                >
                  {saved ? <Check /> : <Save />}
                  {saved ? "Changes saved" : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!hasChanges}
                  onClick={() => {
                    setForm(initialForm);
                    setError("");
                    setSaved(false);
                  }}
                  className="w-full"
                >
                  <RotateCcw /> Undo edits
                </Button>
                <div className="min-h-5" aria-live="polite">
                  {error ? (
                    <p className="text-xs font-medium leading-5 text-destructive">
                      {error}
                    </p>
                  ) : saved ? (
                    <p className="text-xs leading-5 text-emerald-700">
                      Your new preferences are ready. Regenerate Today&apos;s plan to apply new times.
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card className="border-rose-200 bg-rose-50/35 shadow-none ring-0">
              <CardHeader>
                <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                  <Trash2 className="size-4" />
                </div>
                <CardTitle className="text-base font-semibold">Reset app data</CardTitle>
                <CardDescription className="leading-5">
                  Permanently remove your profile, goals, daily plan, and progress history from this browser.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        type="button"
                        variant="destructive"
                        className="w-full"
                      />
                    }
                  >
                    <Trash2 /> Reset everything
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogMedia className="bg-rose-100 text-rose-700">
                        <Trash2 />
                      </AlertDialogMedia>
                      <AlertDialogTitle>Reset all Brolife data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently deletes your profile, goals, tasks, schedule, replanning record, and progress history from this browser. It cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep my data</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={resetApp}
                      >
                        Yes, reset everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </aside>
        </form>
      </div>
    </main>
  );
}

function TimeField({
  id,
  label,
  icon: Icon,
  iconClassName,
  value,
  onChange,
  compact = false,
}: {
  id: string;
  label: string;
  icon?: typeof Sunrise;
  iconClassName?: string;
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2">
        {Icon ? <Icon className={cn("size-4", iconClassName)} /> : null}
        {label}
      </Label>
      <Input
        id={id}
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn("rounded-xl", compact ? "h-10" : "h-11")}
      />
    </div>
  );
}
