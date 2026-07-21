import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { OnboardingGate } from "@/components/onboarding-gate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingGate>
      <AppSidebar />
      <div className="min-h-screen lg:pl-64">
        <AppHeader />
        {children}
      </div>
    </OnboardingGate>
  );
}
