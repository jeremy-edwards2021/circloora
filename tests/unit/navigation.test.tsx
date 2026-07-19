import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PrimaryNavigation } from "@/components/layout/primary-navigation";

const usePathname = vi.fn(() => "/");

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

describe("primary navigation", () => {
  beforeEach(() => usePathname.mockReturnValue("/"));

  it("renders four labeled tab links and a separate Scan action", () => {
    render(<PrimaryNavigation />);
    const navigation = screen.getByRole("navigation", { name: "Primary" });
    expect(navigation.querySelectorAll("a")).toHaveLength(4);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Things" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Missions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Scan something" }),
    ).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("marks subordinate destinations as belonging to their primary tab", () => {
    usePathname.mockReturnValue("/thing/object-1");
    render(<PrimaryNavigation />);
    expect(screen.getByRole("link", { name: "Things" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("opens an accessible two-option scan sheet and returns focus on close", async () => {
    const user = userEvent.setup();
    render(<PrimaryNavigation />);
    const trigger = screen.getByRole("button", { name: "Scan something" });
    await user.click(trigger);

    expect(
      screen.getByRole("dialog", { name: "What are you looking at?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /scan one thing/i }),
    ).toHaveAttribute("href", "/start?mode=single");
    expect(screen.getByRole("link", { name: /scan a room/i })).toHaveAttribute(
      "href",
      "/start?mode=room",
    );

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
