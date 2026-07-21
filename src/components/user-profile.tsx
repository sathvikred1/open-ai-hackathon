"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserName({ fallback = "there" }: { fallback?: string }) {
  const profile = useOnboardingProfile();
  return <>{profile?.name || fallback}</>;
}

export function UserProfile() {
  const profile = useOnboardingProfile();
  const name = profile?.name || "Brolife friend";

  return (
    <Link
      href="/profile"
      aria-label="Open profile and preferences"
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "h-10 gap-2 px-1.5 sm:px-2",
      )}
    >
      <Avatar size="default">
        <AvatarFallback className="bg-emerald-100 font-semibold text-emerald-800">
          {getInitials(name) || "BL"}
        </AvatarFallback>
      </Avatar>
      <div className="hidden text-left sm:block">
        <p className="max-w-24 truncate text-xs font-semibold leading-tight">
          {name}
        </p>
        <p className="text-[10px] leading-tight text-muted-foreground">
          Building momentum
        </p>
      </div>
      <ChevronRight className="hidden size-3.5 text-muted-foreground sm:block" />
    </Link>
  );
}
