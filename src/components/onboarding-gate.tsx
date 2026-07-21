"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

import {
  useHasHydrated,
  useOnboardingProfile,
} from "@/hooks/use-onboarding-profile";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const profile = useOnboardingProfile();

  useEffect(() => {
    if (hasHydrated && !profile) {
      router.replace("/onboarding");
    }
  }, [hasHydrated, profile, router]);

  if (!hasHydrated || !profile) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Sparkles className="size-5 animate-pulse" />
          </div>
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            Getting your day ready…
          </p>
        </div>
      </main>
    );
  }

  return children;
}
