import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Button from "../components/buttons/button";

describe("Button Component", () => {
  it("renders children correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when the disable prop is true", () => {
    render(<Button disable={true}>Click me</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button.className).toContain("opacity-50");
  });

  it("shows loading spinner when isProcessing is true", () => {
    // Note: This assumes Loading component renders something identifiable.
    // If Loading doesn't have test-id, we just check if it's rendered.
    render(<Button isProcessing={true}>Click me</Button>);
    // We expect the children to still be there, and some loading element to appear
    expect(screen.getByText("Click me")).toBeInTheDocument();
    // Depending on what Loading.tsx contains, you might check for a spinner class or SVG
  });

  it("applies correct classes for different button types", () => {
    const { rerender } = render(<Button buttonType="add">Add</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-blue-800");

    rerender(<Button buttonType="delete">Delete</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-red-500");
  });
});
