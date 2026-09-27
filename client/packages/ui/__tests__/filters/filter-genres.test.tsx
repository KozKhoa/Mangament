import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import FilterGenres from "@/components/filters/fiilter-genres";
import useApp from "@/contexts/AppContext";
import "@testing-library/jest-dom";
import React from "react";

// Mock dependencies
vi.mock("@/contexts/AppContext", () => ({
  __esModule: true,
  default: vi.fn(),
}));

// Mock framer-motion to avoid animation and environment issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock icons
vi.mock("@/public/layer.svg", () => ({ default: () => <svg data-testid="layer-icon" /> }));
vi.mock("@/public/sharp-triangle-down.svg", () => ({ default: () => <svg data-testid="dropdown-icon" /> }));
vi.mock("@/public/checkbox/checked.svg", () => ({ default: () => <svg data-testid="checked-icon" /> }));
vi.mock("@/public/checkbox/unchecked.svg", () => ({ default: () => <svg data-testid="unchecked-icon" /> }));
vi.mock("@/public/checkbox/tick.svg", () => ({ default: () => <svg data-testid="tick-icon" /> }));
vi.mock("@/public/search.svg", () => ({ default: () => <svg data-testid="search-icon" /> }));
vi.mock("@/public/x-circle.svg", () => ({ default: () => <svg data-testid="x-circle-icon" /> }));

describe("FilterGenres Component", () => {
  const mockGenres = [{ name: "action" }, { name: "adventure" }, { name: "comedy" }, { name: "romance" }];
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useApp as any).mockReturnValue({ genres: mockGenres });
  });

  afterEach(() => {
    cleanup();
  });

  const openDropdown = () => {
    const button = screen.getByText("Thể loại").closest("button");
    fireEvent.click(button!);
  };

  it("1. Render filter genres button", () => {
    render(<FilterGenres value={[]} onChange={mockOnChange} />);
    expect(screen.getByText("Thể loại")).toBeInTheDocument();
  });

  it("2. Display filter genres dropdown when filter genres button is clicked", () => {
    render(<FilterGenres value={[]} onChange={mockOnChange} />);
    openDropdown();
    expect(screen.getByPlaceholderText(/Tìm kiếm/)).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Adventure")).toBeInTheDocument();
    expect(screen.getByText("Comedy")).toBeInTheDocument();
    expect(screen.getByText("Romance")).toBeInTheDocument();
  });

  it("3. Hide filter genres dropdown when filter genres button is clicked again", () => {
    render(<FilterGenres value={[]} onChange={mockOnChange} />);
    const button = screen.getByText("Thể loại").closest("button");
    fireEvent.click(button!); // Open
    expect(screen.getByPlaceholderText(/Tìm kiếm/)).toBeInTheDocument();
    fireEvent.click(button!); // Close
    expect(screen.queryByPlaceholderText(/Tìm kiếm/)).not.toBeInTheDocument();
  });

  it("4. Close filter genres dropdown when click outside of dropdown", () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <FilterGenres value={[]} onChange={mockOnChange} />
      </div>,
    );
    openDropdown();
    expect(screen.getByPlaceholderText(/Tìm kiếm/)).toBeInTheDocument();

    // Simulate click outside
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByPlaceholderText(/Tìm kiếm/)).not.toBeInTheDocument();
  });

  it("5. Close filter genres dropdown when click accept button (Finish)", () => {
    render(<FilterGenres value={[]} onChange={mockOnChange} />);
    openDropdown();
    const finishBtn = screen.getByText("Finish");
    fireEvent.click(finishBtn);
    expect(screen.queryByPlaceholderText(/Tìm kiếm/)).not.toBeInTheDocument();
  });

  it("6. Close filter genres dropdown when click close button (Reset)", () => {
    render(<FilterGenres value={[]} onChange={mockOnChange} />);
    openDropdown();
    const resetBtn = screen.getByText("Reset");
    fireEvent.click(resetBtn);
    expect(screen.queryByPlaceholderText(/Tìm kiếm/)).not.toBeInTheDocument();
  });

  it("7. Call onChange when click Finish button", () => {
    render(<FilterGenres value={[]} onChange={mockOnChange} />);
    openDropdown();

    // Select 'Action'
    const actionCheckbox = screen.getByLabelText("Action");
    fireEvent.click(actionCheckbox);

    const finishBtn = screen.getByText("Finish");
    fireEvent.click(finishBtn);

    expect(mockOnChange).toHaveBeenCalledWith(["action"]);
  });

  it("8. Call onChange when click Reset button", () => {
    render(<FilterGenres value={["action"]} onChange={mockOnChange} />);
    openDropdown();

    const resetBtn = screen.getByText("Reset");
    fireEvent.click(resetBtn);

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it("9. Uncheck all checkbox when click reset button", () => {
    render(<FilterGenres value={["action", "adventure"]} onChange={mockOnChange} />);
    openDropdown();

    expect(screen.getByLabelText("Action")).toBeChecked();
    expect(screen.getByLabelText("Adventure")).toBeChecked();

    const resetBtn = screen.getByText("Reset");
    fireEvent.click(resetBtn);

    // Re-open to check state internally (FilterGenres resets its internal state)
    openDropdown();
    expect(screen.getByLabelText("Action")).not.toBeChecked();
    expect(screen.getByLabelText("Adventure")).not.toBeChecked();
  });

  it("10. Check only genres provided in value props", () => {
    render(<FilterGenres value={["comedy"]} onChange={mockOnChange} />);
    openDropdown();

    expect(screen.getByLabelText("Comedy")).toBeChecked();
    expect(screen.getByLabelText("Action")).not.toBeChecked();
    expect(screen.getByLabelText("Adventure")).not.toBeChecked();
  });

  it("11-13. Filter genres search with keyword", async () => {
    vi.useFakeTimers();
    render(<FilterGenres value={[]} onChange={mockOnChange} />);
    openDropdown();

    const searchInput = screen.getByPlaceholderText(/Tìm kiếm/);
    fireEvent.change(searchInput, { target: { value: "rom" } });

    // Fast-forward time for debounced search (delay is 200ms in component)
    await React.act(async () => {
      vi.advanceTimersByTime(300);
    });

    // 'Romance' should be visible, others hidden
    // The hidden class is applied to the wrapper div in FilterGenres.tsx (GenreCheckBox)
    // The Checkbox (label) is inside this div.
    const romanceWrapper = screen.getByText("Romance").closest("div");
    const actionWrapper = screen.getByText("Action").closest("div");
    const adventureWrapper = screen.getByText("Adventure").closest("div");

    expect(romanceWrapper).not.toHaveClass("hidden");
    expect(actionWrapper).toHaveClass("hidden");
    expect(adventureWrapper).toHaveClass("hidden");

    vi.useRealTimers();
  });

  // describe("Edge Cases", () => {
  //   it("value is undefined", () => {
  //     // Should not crash and handle gracefully
  //     render(<FilterGenres value={undefined as any} onChange={mockOnChange} />);
  //     openDropdown();
  //     expect(screen.getByText("Action")).toBeInTheDocument();
  //   });

  //   it("value is empty array", () => {
  //     render(<FilterGenres value={[]} onChange={mockOnChange} />);
  //     openDropdown();
  //     mockGenres.forEach((g) => {
  //       expect(screen.getByLabelText(new RegExp(g, "i"))).not.toBeChecked();
  //     });
  //   });

  //   it("onChange is undefined", () => {
  //     render(<FilterGenres value={["action"]} onChange={undefined} />);
  //     openDropdown();
  //     const finishBtn = screen.getByText("Finish");
  //     // Should not throw error
  //     expect(() => fireEvent.click(finishBtn)).not.toThrow();
  //   });

  //   it("multiple rapid clicks", () => {
  //     render(<FilterGenres value={[]} onChange={mockOnChange} />);
  //     const button = screen.getByText("Thể loại").closest("button");

  //     fireEvent.click(button!);
  //     fireEvent.click(button!);
  //     fireEvent.click(button!);

  //     // Should be open (3 clicks: open -> close -> open)
  //     expect(screen.getByPlaceholderText(/Tìm kiếm/)).toBeInTheDocument();
  //   });
  // });
});
