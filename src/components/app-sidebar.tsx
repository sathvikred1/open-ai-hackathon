import { SidebarContent } from "@/components/sidebar-content";

export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border lg:block">
      <SidebarContent />
    </aside>
  );
}
