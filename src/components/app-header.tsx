import { Bell, Search } from "lucide-react";

import { MobileSidebar } from "@/components/mobile-sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserProfile } from "@/components/user-profile";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b bg-background/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <div>
          <p className="text-sm font-semibold tracking-tight sm:text-base">Today</p>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Monday, July 20
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button
          variant="outline"
          className="hidden h-9 w-52 justify-start gap-2 text-muted-foreground shadow-none md:flex"
        >
          <Search className="size-4" />
          <span className="font-normal">Search anything</span>
          <kbd className="ml-auto rounded-md border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="Search"
          className="md:hidden"
        >
          <Search />
        </Button>
        <Button variant="ghost" size="icon-lg" aria-label="Notifications">
          <span className="relative">
            <Bell className="size-[18px]" />
            <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-emerald-500 ring-2 ring-background" />
          </span>
        </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <UserProfile />
      </div>
    </header>
  );
}
