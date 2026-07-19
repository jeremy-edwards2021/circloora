import type { ReactNode, SVGProps } from "react";

type IconName =
  | "home"
  | "things"
  | "missions"
  | "profile"
  | "camera"
  | "arrow"
  | "close"
  | "wifi-off"
  | "spark";

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, ...props }: IconProps) {
  const common = {
    "aria-hidden": true,
    fill: "none",
    height: size,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
    width: size,
  };

  const paths: Record<IconName, ReactNode> = {
    home: (
      <>
        <path d="m3.5 10.8 8.5-7 8.5 7" />
        <path d="M5.5 9.5v10h13v-10M9.5 19.5v-6h5v6" />
      </>
    ),
    things: (
      <>
        <rect height="7" rx="2" width="7" x="3" y="3" />
        <rect height="7" rx="2" width="7" x="14" y="3" />
        <rect height="7" rx="2" width="7" x="3" y="14" />
        <rect height="7" rx="2" width="7" x="14" y="14" />
      </>
    ),
    missions: (
      <>
        <path d="M7 4h10a2 2 0 0 1 2 2v14H5V6a2 2 0 0 1 2-2Z" />
        <path d="m8.5 9 1.5 1.5L13 7.5M8.5 15h7" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5.5 20c.4-4 2.6-6 6.5-6s6.1 2 6.5 6" />
      </>
    ),
    camera: (
      <>
        <path d="M4 8.5h3l1.5-2h7l1.5 2h3v10H4Z" />
        <circle cx="12" cy="13.5" r="3.2" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    "wifi-off": (
      <>
        <path d="M2.5 8.5a15 15 0 0 1 4.3-2.1M21.5 8.5a15.2 15.2 0 0 0-9.1-3.5" />
        <path d="M5.5 12a10.5 10.5 0 0 1 5-2.3M18.5 12a10.2 10.2 0 0 0-2.2-1.3M8.8 15.2a5.2 5.2 0 0 1 5.8-.8" />
        <path d="M12 19h.01M3 3l18 18" />
      </>
    ),
    spark: (
      <>
        <path d="M12 2.8c.6 4.7 2.5 6.6 7.2 7.2-4.7.6-6.6 2.5-7.2 7.2-.6-4.7-2.5-6.6-7.2-7.2 4.7-.6 6.6-2.5 7.2-7.2Z" />
        <path d="M19 17.5c.2 1.7.8 2.3 2.5 2.5-1.7.2-2.3.8-2.5 2.5-.2-1.7-.8-2.3-2.5-2.5 1.7-.2 2.3-.8 2.5-2.5Z" />
      </>
    ),
  };

  return (
    <svg {...common} {...props}>
      {paths[name]}
    </svg>
  );
}
