import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ViewStatePanel } from "@/components/states/view-state";

describe("ViewStatePanel", () => {
  it("announces blocking states assertively and exposes a real recovery link", () => {
    render(
      <ViewStatePanel
        action={{ href: "/catalog", label: "Go to Things" }}
        description="The requested Thing is no longer available."
        state="blocking_error"
        title="Thing not found"
      />,
    );
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
    expect(screen.getByRole("link", { name: "Go to Things" })).toHaveAttribute(
      "href",
      "/catalog",
    );
  });

  it("marks loading without inventing a completion percentage", () => {
    render(
      <ViewStatePanel
        description="Opening your saved work."
        state="loading"
        title="Loading"
      />,
    );
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).not.toHaveTextContent("%");
  });
});
