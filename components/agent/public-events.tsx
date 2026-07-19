import { cn } from "@/lib/ui/cn";
import type { AgentEvent } from "@/lib/schemas/investigation-agent";

const typeLabels: Record<AgentEvent["eventType"], string> = {
  run_started: "Investigation started",
  agent_selected: "Agent selected",
  tool_started: "Analyzing",
  tool_completed: "Analysis complete",
  evidence_requested: "Evidence needed",
  approval_requested: "Approval needed",
  recommendation_revised: "Recommendation updated",
  run_paused: "Paused",
  run_resumed: "Resumed",
  run_completed: "Complete",
  run_failed: "Failed",
  run_cancelled: "Cancelled",
};

const typeTones: Record<AgentEvent["eventType"], string> = {
  run_started: "border-l-accent",
  agent_selected: "border-l-carbon",
  tool_started: "border-l-carbon",
  tool_completed: "border-l-sage",
  evidence_requested: "border-l-amber",
  approval_requested: "border-l-amber",
  recommendation_revised: "border-l-accent",
  run_paused: "border-l-amber",
  run_resumed: "border-l-accent",
  run_completed: "border-l-sage",
  run_failed: "border-l-danger",
  run_cancelled: "border-l-carbon",
};

export interface PublicEventsProps {
  className?: string;
  events: AgentEvent[];
  label?: string;
}

export function PublicEvents({
  className,
  events,
  label = "Agent activity",
}: PublicEventsProps) {
  return (
    <section aria-label={label} className={cn("space-y-2", className)}>
      {events.map((event) => (
        <div
          className={cn(
            "border-l-2 pl-3 py-2",
            typeTones[event.eventType],
          )}
          key={event.id}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold text-carbon-subtle uppercase tracking-[0.08em]">
              {typeLabels[event.eventType]}
            </span>
            <span className="text-[11px] text-carbon-muted">
              {event.agent}
            </span>
          </div>
          <p className="mt-0.5 text-sm leading-5 text-carbon">
            {event.summary}
          </p>
        </div>
      ))}
    </section>
  );
}
