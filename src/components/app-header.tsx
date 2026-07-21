import { ShieldCheck } from "lucide-react";

import { AppHeaderTitle } from "@/components/app-header-title";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { Separator } from "@/components/ui/separator";
import { UserProfile } from "@/components/user-profile";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b bg-background/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <AppHeaderTitle />
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="hidden items-center gap-1.5 text-xs font-medium text-muted-foreground md:flex">
          <ShieldCheck className="size-3.5 text-emerald-700" />
          Saved on this device
        </div>
        <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />
        <UserProfile />
      </div>
    </header>
  );
}
