"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  HeartPulse,
  MessageCircleHeart,
  MoonStar,
  Rocket,
  Settings2,
  Target,
} from "lucide-react";

import { BrolifeLogo } from "@/components/brolife-logo";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { cn } from "@/lib/utils";

const primaryNavigation = [
  { label: "Today", icon: CalendarDays, href: "/" },
  { label: "Brolife Chat", icon: MessageCircleHeart, href: "/chat" },
  { label: "Goals", icon: Target, href: "/goals" },
  { label: "Progress", icon: BarChart3, href: "/progress" },
];

const categories = [
  { label: "Work", icon: BriefcaseBusiness, color: "text-sky-600" },
  { label: "Learning", icon: BookOpen, color: "text-violet-600" },
  { label: "Health", icon: HeartPulse, color: "text-rose-500" },
  { label: "Side hustle", icon: Rocket, color: "text-amber-600" },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const profile = useOnboardingProfile();
  const nightFocusPreference =
    profile?.nightFocusPreference ?? "alternating";
  const alternatingNightFocus = [0, 1, 3, 5].includes(new Date().getDay())
    ? "Side hustle"
    : "Health";
  const nightFocus =
    nightFocusPreference === "alternating"
      ? alternatingNightFocus
      : nightFocusPreference === "side-hustle"
        ? "Side hustle"
        : "Health";

  return (
    <div className="flex h-full flex-col bg-sidebar px-3 py-4 text-sidebar-foreground">
      <Link
        href="/"
        onClick={onNavigate}
        aria-label="Go to Today"
        className="rounded-xl px-2 pb-7 pt-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <BrolifeLogo />
      </Link>

      <nav aria-label="Main navigation" className="space-y-1">
        {primaryNavigation.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : item.href
                ? pathname.startsWith(item.href)
                : false;
          const className = cn(
            "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
            active
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          );

          const content = (
            <>
              <Icon className="size-[17px]" strokeWidth={2} />
              <span>{item.label}</span>
            </>
          );

          return item.href ? (
            <Link
              key={item.label}
              href={item.href}
              className={className}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
            >
              {content}
            </Link>
          ) : (
            <button key={item.label} type="button" className={className}>
              {content}
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-2 pt-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/70">
          Categories
        </p>
      </div>
      <div aria-label="Task categories" className="space-y-0.5">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <div
              key={category.label}
              className="flex h-9 w-full items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground"
            >
              <Icon className={cn("size-4", category.color)} />
              <span>{category.label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-auto space-y-3 pt-6">
        <div className="rounded-2xl bg-emerald-950 p-4 text-white shadow-sm">
          <div className="mb-3 flex items-start justify-between">
            <div className="flex size-8 items-center justify-center rounded-lg bg-white/10">
              <MoonStar className="size-4 text-emerald-200" />
            </div>
            <Badge className="border-0 bg-emerald-400/15 text-[10px] text-emerald-100">
              Tonight
            </Badge>
          </div>
          <p className="text-xs font-medium text-emerald-200">
            Night focus preference
          </p>
          <p className="mt-1 text-sm font-semibold">{nightFocus}</p>
          <p className="mt-1 text-xs text-emerald-100/60">
            {nightFocusPreference === "alternating"
              ? "Alternates by weekday"
              : "Selected for every evening"}
          </p>
        </div>

        <Separator />
        <Link
          href="/profile"
          onClick={onNavigate}
          className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Settings2 className="size-4" />
          Profile & preferences
        </Link>
      </div>
    </div>
  );
}
