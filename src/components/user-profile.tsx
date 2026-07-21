"use client";

import { ChevronDown } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";

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
    <Button variant="ghost" className="h-10 gap-2 px-1.5 sm:px-2">
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
      <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
    </Button>
  );
}
