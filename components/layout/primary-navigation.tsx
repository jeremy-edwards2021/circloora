"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Icon, type IconProps } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/ui/cn";

interface Tab {
  href: string;
  icon: IconProps["name"];
  label: string;
  matches: (pathname: string) => boolean;
}

const tabs: Tab[] = [
  { href: "/", icon: "home", label: "Home", matches: (path) => path === "/" },
  {
    href: "/catalog",
    icon: "things",
    label: "Things",
    matches: (path) =>
      path.startsWith("/catalog") || path.startsWith("/thing/"),
  },
  {
    href: "/missions",
    icon: "missions",
    label: "Missions",
    matches: (path) =>
      path.startsWith("/missions") ||
      path.startsWith("/mission/") ||
      path.startsWith("/plan/") ||
      path.startsWith("/verify/"),
  },
  {
    href: "/profile",
    icon: "profile",
    label: "Profile",
    matches: (path) =>
      path.startsWith("/profile") ||
      path.startsWith("/history") ||
      path.startsWith("/credits") ||
      path.startsWith("/impact") ||
      path.startsWith("/install"),
  },
];

function TabLink({ pathname, tab }: { pathname: string; tab: Tab }) {
  const active = tab.matches(pathname);
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn("tab-link", active && "tab-link-active")}
      href={tab.href}
    >
      <Icon name={tab.icon} size={21} />
      <span>{tab.label}</span>
    </Link>
  );
}

export function PrimaryNavigation() {
  const pathname = usePathname();
  const [scanOpen, setScanOpen] = useState(false);

  return (
    <>
      <nav aria-label="Primary" className="tab-bar">
        <div className="tab-bar-inner">
          <TabLink pathname={pathname} tab={tabs[0]!} />
          <TabLink pathname={pathname} tab={tabs[1]!} />
          <button
            aria-haspopup="dialog"
            aria-label="Scan something"
            className="scan-action"
            onClick={() => setScanOpen(true)}
            type="button"
          >
            <Icon name="camera" size={25} />
            <span aria-hidden="true">Scan</span>
          </button>
          <TabLink pathname={pathname} tab={tabs[2]!} />
          <TabLink pathname={pathname} tab={tabs[3]!} />
        </div>
      </nav>
      <Sheet
        description="Start a focused investigation. You can continue without creating an account."
        onClose={() => setScanOpen(false)}
        open={scanOpen}
        title="What are you looking at?"
      >
        <div className="grid gap-3">
          <Link
            className="scan-choice"
            data-autofocus
            href="/start?mode=single"
            onClick={() => setScanOpen(false)}
          >
            <span>
              <strong>Scan one thing</strong>
              <small>
                Build a living Passport and find its best next life.
              </small>
            </span>
            <Icon name="arrow" />
          </Link>
          <Link
            className="scan-choice"
            href="/start?mode=room"
            onClick={() => setScanOpen(false)}
          >
            <span>
              <strong>Scan a room</strong>
              <small>Turn several objects into a coordinated move plan.</small>
            </span>
            <Icon name="arrow" />
          </Link>
        </div>
      </Sheet>
    </>
  );
}
