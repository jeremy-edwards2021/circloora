import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/ui/cn";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type ButtonSize = "default" | "compact" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-carbon text-bone shadow-[0_12px_32px_rgba(27,31,29,0.16)] hover:bg-carbon-soft active:translate-y-px",
  secondary:
    "border border-line bg-surface text-carbon shadow-[0_8px_24px_rgba(27,31,29,0.06)] hover:bg-surface-raised active:translate-y-px",
  quiet: "text-carbon hover:bg-carbon/[0.06] active:bg-carbon/[0.1]",
  danger:
    "bg-danger text-white shadow-[0_10px_24px_rgba(160,52,42,0.18)] hover:bg-danger-dark",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "min-h-12 px-5 py-3 text-[0.9375rem]",
  compact: "min-h-11 px-4 py-2 text-sm",
  icon: "size-11 p-0",
};

export function buttonStyles({
  className,
  size = "default",
  variant = "primary",
}: {
  className?: string | undefined;
  size?: ButtonSize;
  variant?: ButtonVariant;
} = {}) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.01em] transition-[background-color,color,border-color,transform,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bone disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export function Button({
  className,
  size = "default",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonStyles({ className, size, variant })}
      type={type}
      {...props}
    />
  );
}
