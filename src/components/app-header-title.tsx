"use client";

import { usePathname } from "next/navigation";

import { useHasHydrated } from "@/hooks/use-onboarding-profile";

const routeDetails = {
  goals: {
    title: "Goals",
    subtitle: "Turn intentions into steady progress",
  },
  chat: {
    title: "Brolife Chat",
    subtitle: "Support grounded in your goals and today’s plan",
  },
  progress: {
    title: "Progress",
    subtitle: "See your wins and keep the momentum going",
  },
  profile: {
    title: "Profile",
    subtitle: "Your rhythm, priorities, and app preferences",
  },
  today: {
    title: "Today",
  },
};

export function AppHeaderTitle() {
  const pathname = usePathname();
  const hasHydrated = useHasHydrated();
  const details = pathname.startsWith("/profile")
    ? routeDetails.profile
    : pathname.startsWith("/progress")
      ? routeDetails.progress
      : pathname.startsWith("/chat")
        ? routeDetails.chat
        : pathname.startsWith("/goals")
          ? routeDetails.goals
          : {
              ...routeDetails.today,
              subtitle: hasHydrated
                ? new Intl.DateTimeFormat("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  }).format(new Date())
                : "Your daily plan",
            };

  return (
    <div>
      <p className="text-sm font-semibold tracking-tight sm:text-base">
        {details.title}
      </p>
      <p className="hidden text-xs text-muted-foreground sm:block">
        {details.subtitle}
      </p>
    </div>
  );
}
