"use client";

import { usePathname } from "next/navigation";

const routeDetails = {
  goals: {
    title: "Goals",
    subtitle: "Turn intentions into steady progress",
  },
  today: {
    title: "Today",
    subtitle: "Monday, July 20",
  },
};

export function AppHeaderTitle() {
  const pathname = usePathname();
  const details = pathname.startsWith("/goals")
    ? routeDetails.goals
    : routeDetails.today;

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
