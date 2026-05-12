import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import StoryCardAllInfo from "../components/cards/stories/story-card-all-info";
import Story from "@/types/story";

// Mocking dependencies
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ priority, ...props }: any) => <img {...props} />,
}));

vi.mock("@/components/loadings/loading", () => ({
  __esModule: true,
  default: ({ className }: any) => <div data-testid="loading-spinner" className={className} />,
}));

vi.mock("@/components/displays/ratings/display-star", () => ({
  __esModule: true,
  default: ({ rating }: any) => <div data-testid="display-star">{rating}</div>,
}));

vi.mock("@/components/tags/story-status-tag", () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="status-tag">{children}</div>,
}));

vi.mock("@/components/tags/tag", () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="tag">{children}</div>,
}));

vi.mock("@/components/tags/genre-tag", () => ({
  __esModule: true,
  default: ({ tagName }: any) => <div data-testid="genre-tag">{tagName}</div>,
}));

vi.mock("@/components/lines/line", () => ({
  __esModule: true,
  default: () => <hr data-testid="line" />,
}));

const mockStory: Story = {
  id: "story-1",
  title: "Test Story All Info",
  type: "light_novel",
  status: "completed",
  view: 5000,
  star: 4.8,
  summary: "This is a test summary for the story.",
  cover_art: { url: "https://example.com/cover-all.jpg" },
  nation: {
    name: "Korea",
    flag_icon: "🇰🇷",
  },
  author: [{ name: "Author One" }, { name: "Author Two" }],
  genres: ["Fantasy", "Action"],
  other_titles: ["Title Alternative"],
  children: [],
};

describe("StoryCardAllInfo Component", () => {
  it("renders loading state when story is not provided", () => {
    render(<StoryCardAllInfo story={undefined} />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("renders all story information correctly", () => {
    render(<StoryCardAllInfo story={mockStory} />);

    // Title and type
    expect(screen.getByText("Test Story All Info")).toBeInTheDocument();
    expect(screen.getByText("[Light Novel]")).toBeInTheDocument();

    // Stats
    expect(screen.getByText("5.000")).toBeInTheDocument(); // beautifulView(5000) -> 5.000
    expect(screen.getAllByText("4.8").length).toBeGreaterThan(0);

    // Status
    expect(screen.getByTestId("status-tag")).toHaveTextContent("Completed");

    // Authors
    expect(screen.getByText(/Author One/)).toBeInTheDocument();
    expect(screen.getByText(/Author Two/)).toBeInTheDocument();

    // Genres
    const genres = screen.getAllByTestId("genre-tag");
    expect(genres).toHaveLength(2);
    expect(genres[0]).toHaveTextContent("Fantasy");
    expect(genres[1]).toHaveTextContent("Action");

    // Other titles
    expect(screen.getByTestId("tag")).toHaveTextContent("Title Alternative");

    // Summary
    expect(screen.getByText("This is a test summary for the story.")).toBeInTheDocument();

    // Images
    expect(screen.getByAltText("Cover Art")).toHaveAttribute("src", "https://example.com/cover-all.jpg");
    expect(screen.getByText("🇰🇷")).toBeInTheDocument();
  });
});
