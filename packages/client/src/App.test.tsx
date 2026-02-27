import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders the application heading", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Vault Triage");
  });

  it("renders with the expected root class for styling", () => {
    const { container } = render(<App />);
    expect(container.firstChild).toHaveClass("min-h-screen");
  });
});
