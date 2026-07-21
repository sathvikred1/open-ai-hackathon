"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  HeartPulse,
  ListTodo,
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
  { label: "Tasks", icon: ListTodo, count: 8, href: null },
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
      <div className="px-2 pb-7 pt-1">
        <BrolifeLogo />
      </div>

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
              {item.count ? (
                <Badge
                  variant="secondary"
                  className="ml-auto h-5 min-w-5 px-1.5 text-[10px]"
                >
                  {item.count}
                </Badge>
              ) : null}
            </>
          );

          return item.href ? (
            <Link
              key={item.label}
              href={item.href}
              className={className}
              onClick={onNavigate}
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
          Categories
        </p>
      </div>
      <nav aria-label="Task categories" className="space-y-0.5">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.label}
              type="button"
              className="flex h-9 w-full items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Icon className={cn("size-4", category.color)} />
              <span>{category.label}</span>
            </button>
          );
        })}
      </nav>

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
          <p className="text-xs font-medium text-emerald-200">Night focus</p>
          <p className="mt-1 text-sm font-semibold">{nightFocus}</p>
          <p className="mt-1 text-xs text-emerald-100/60">8:30–10:00 PM</p>
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
