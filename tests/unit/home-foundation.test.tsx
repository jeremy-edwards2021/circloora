import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LandingHome } from "@/components/home/landing-home";

describe("landing Home foundation", () => {
  it("communicates the product thesis and required first-run actions", () => {
    render(<LandingHome />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Give everything another life.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/not another recycling scanner/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /scan a room/i })).toHaveAttribute(
      "href",
      "/start?mode=room",
    );
    expect(
      screen.getByRole("link", { name: /scan one thing/i }),
    ).toHaveAttribute("href", "/start?mode=single");
    expect(
      screen.getByText(/images are analyzed privately/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/demo analysis—openai is not currently connected/i),
    ).toBeInTheDocument();
  });

  it("uses ordered, semantic product steps", () => {
    const { container } = render(<LandingHome />);
    const steps = container.querySelectorAll("ol li");
    expect(steps).toHaveLength(3);
    expect(
      screen.getByRole("heading", { name: "Scan it" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Understand it" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Circulate it" }),
    ).toBeInTheDocument();
  });
});
