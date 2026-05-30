import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import StoryCard from "../components/cards/stories/story-card";
import useAuth from "@/contexts/AuthContext";
import favouriteService from "@/services/favourite";
import { toast } from "sonner";
import Story from "@/types/story";

// Mocking dependencies
vi.mock("@/contexts/AuthContext", () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock("@/services/favourite", () => ({
  __esModule: true,
  default: {
    addNewFavouriteStory: vi.fn(),
    removeFavouriteStory: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    warning: vi.fn(),
    message: vi.fn(),
  },
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ priority, ...props }: any) => <img {...props} />,
}));

vi.mock("@/components/link/Link", () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

vi.mock("@/public/eye/open.svg", () => ({
  __esModule: true,
  default: () => <div data-testid="eye-icon" />,
}));

vi.mock("@/public/heart.svg", () => ({
  __esModule: true,
  default: ({ className }: any) => <div data-testid="heart-icon" className={className} />,
}));

vi.mock("@/components/loadings/loading", () => ({
  __esModule: true,
  default: () => <div data-testid="loading-spinner" />,
}));

vi.mock("@/components/displays/ratings/display-star", () => ({
  __esModule: true,
  default: ({ rating }: any) => <div data-testid="display-star">{rating}</div>,
}));

const mockStory: Story = {
  id: "story-1",
  title: "Test Story",
  type: "manga",
  status: "ongoing",
  view: 1000,
  star: 4.5,
  cover_art: { url: "https://example.com/cover.jpg" },
  nation: {
    name: "Japan",
    flag_icon: "🇯🇵",
    flag_image: { url: "https://example.com/flag.png" }
  },
  newest_chapter: [
    {
      id: "node-1",
      type: "chapter",
      order_index: 10,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      children: []
    } as any
  ],
  children: [],
};

describe("StoryCard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: null });
  });

  it("renders story information correctly", () => {
    render(<StoryCard data={mockStory} />);

    expect(screen.getByText("Test Story")).toBeInTheDocument();
    expect(screen.getByText("[Manga]")).toBeInTheDocument();
    expect(screen.getByText("1.000")).toBeInTheDocument(); // beautifulView(1000) -> 1.000
    expect(screen.getAllByText("4.5").length).toBeGreaterThan(0);
    expect(screen.getByAltText("Cover Art")).toHaveAttribute("src", "https://example.com/cover.jpg");
    expect(screen.getByAltText("Japan")).toHaveAttribute("src", "https://example.com/flag.png");
  });

  it("renders newest chapter info if available", () => {
    render(<StoryCard data={mockStory} />);

    expect(screen.getByText("Chap mới nhất:")).toBeInTheDocument();
    // newestChapter calculation: "Chapter 10" (from node type + index)
    // Actually convertNewestChapter will produce something like "Chapter 10"
    expect(screen.getByText(/Chapter 10/)).toBeInTheDocument();
    expect(screen.getByText("2 ngày trước")).toBeInTheDocument();
  });

  it("shows warning toast when trying to favourite while not logged in", () => {
    render(<StoryCard data={mockStory} />);
    
    const favButton = screen.getByRole("button");
    fireEvent.click(favButton);

    expect(toast.warning).toHaveBeenCalledWith("Bạn phải đăng nhập để thêm và danh sách yêu thích");
  });

  it("calls addNewFavouriteStory when user is logged in and story is not favourited", async () => {
    (useAuth as any).mockReturnValue({ user: { id: "user-1" } });
    (favouriteService.addNewFavouriteStory as any).mockResolvedValue({
      success: true,
      data: { id: "fav-1" },
    });

    render(<StoryCard data={mockStory} />);
    
    const favButton = screen.getByRole("button");
    fireEvent.click(favButton);

    expect(favouriteService.addNewFavouriteStory).toHaveBeenCalledWith("story-1");
    
    await waitFor(() => {
      expect(toast.message).toHaveBeenCalledWith("Đã thêm Test Story vào danh sách yêu thích");
    });
    
    // Check if heart icon is filled
    const heartIcon = screen.getByTestId("heart-icon");
    expect(heartIcon.className).toContain("fill-red-400");
  });

  it("calls removeFavouriteStory when story is already favourited", async () => {
    const favouritedStory = {
      ...mockStory,
      favourite: { id: "fav-1", user_id: "user-1" },
    };
    (useAuth as any).mockReturnValue({ user: { id: "user-1" } });
    (favouriteService.removeFavouriteStory as any).mockResolvedValue({
      success: true,
    });

    render(<StoryCard data={favouritedStory} />);
    
    const favButton = screen.getByRole("button");
    
    // Heart should be filled initially
    expect(screen.getByTestId("heart-icon").className).toContain("fill-red-400");

    fireEvent.click(favButton);

    expect(favouriteService.removeFavouriteStory).toHaveBeenCalledWith("fav-1");
    
    await waitFor(() => {
      expect(toast.message).toHaveBeenCalledWith("Đã xóa Test Story khỏi danh sách yêu thích");
    });

    // Heart should be empty now
    expect(screen.getByTestId("heart-icon").className).not.toContain("fill-red-400");
  });

  it("shows loading spinner while processing favourite toggle", async () => {
    (useAuth as any).mockReturnValue({ user: { id: "user-1" } });
    
    // Make service hang
    let resolvePromise: any;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    (favouriteService.addNewFavouriteStory as any).mockReturnValue(promise);

    render(<StoryCard data={mockStory} />);
    
    const favButton = screen.getByRole("button");
    fireEvent.click(favButton);

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(favButton).toBeDisabled();

    // Finish the request
    resolvePromise({ success: true, data: { id: "fav-2" } });
    
    await waitFor(() => {
      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
    });
  });
});
