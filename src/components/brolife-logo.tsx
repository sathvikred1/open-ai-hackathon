import { Sparkles } from "lucide-react";

export function BrolifeLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
        <Sparkles className="size-4" strokeWidth={2.4} />
      </div>
      <div>
        <p className="text-[17px] font-semibold tracking-tight">Brolife</p>
        <p className="text-[11px] font-medium text-muted-foreground">
          Plan better. Live lighter.
        </p>
      </div>
    </div>
  );
}
