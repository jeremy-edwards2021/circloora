import { Icon } from "@/components/ui/icons";

export function DemoDisclosure({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "inline-flex items-center gap-2 text-xs font-medium text-carbon-muted"
          : "flex items-start gap-2.5 rounded-2xl border border-line bg-surface/80 px-4 py-3 text-xs leading-5 font-medium text-carbon-muted"
      }
      data-testid="demo-disclosure"
    >
      <Icon className="mt-0.5 shrink-0 text-accent" name="spark" size={16} />
      <span>Demo analysis—OpenAI is not currently connected.</span>
    </div>
  );
}
