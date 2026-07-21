"use client";

import { Menu } from "lucide-react";

import { SidebarContent } from "@/components/sidebar-content";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger
        aria-label="Open navigation"
        className="flex size-9 items-center justify-center rounded-xl border bg-background text-foreground shadow-xs transition-colors hover:bg-muted lg:hidden"
      >
        <Menu className="size-[18px]" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0" showCloseButton={false}>
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Open Brolife pages and categories.</SheetDescription>
        </SheetHeader>
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
}
