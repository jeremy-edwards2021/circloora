import Link from "next/link";
import type { ReactNode } from "react";

import { buttonStyles } from "@/components/ui/button";
import { Icon, type IconProps } from "@/components/ui/icons";
import { cn } from "@/lib/ui/cn";

export type ViewState =
  | "initial"
  | "loading"
  | "refreshing"
  | "ready"
  | "empty"
  | "offline"
  | "permission_denied"
  | "partial_error"
  | "blocking_error"
  | "safety_escalation";

interface StateAction {
  href: string;
  label: string;
}

export interface ViewStatePanelProps {
  action?: StateAction;
  children?: ReactNode;
  className?: string;
  description: string;
  secondaryAction?: StateAction;
  state: Exclude<ViewState, "initial" | "refreshing" | "ready">;
  title: string;
}

const stateIcons: Record<ViewStatePanelProps["state"], IconProps["name"]> = {
  loading: "spark",
  empty: "things",
  offline: "wifi-off",
  permission_denied: "camera",
  partial_error: "spark",
  blocking_error: "close",
  safety_escalation: "close",
};

export function ViewStatePanel({
  action,
  children,
  className,
  description,
  secondaryAction,
  state,
  title,
}: ViewStatePanelProps) {
  const isLoading = state === "loading";
  const urgent = state === "blocking_error" || state === "safety_escalation";

  return (
    <section
      aria-busy={isLoading || undefined}
      aria-live={urgent ? "assertive" : "polite"}
      className={cn("state-panel", urgent && "state-panel-urgent", className)}
      role={urgent ? "alert" : "status"}
    >
      <span aria-hidden="true" className="state-icon">
        <Icon name={stateIcons[state]} size={22} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
      {isLoading ? (
        <div aria-hidden="true" className="mt-5 grid w-full gap-2.5">
          <span className="skeleton h-4 w-4/5" />
          <span className="skeleton h-4 w-3/5" />
        </div>
      ) : null}
      {action || secondaryAction ? (
        <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          {action ? (
            <Link
              className={buttonStyles({ className: "w-full sm:w-auto" })}
              href={action.href}
            >
              {action.label}
            </Link>
          ) : null}
          {secondaryAction ? (
            <Link
              className={buttonStyles({
                className: "w-full sm:w-auto",
                variant: "secondary",
              })}
              href={secondaryAction.href}
            >
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
