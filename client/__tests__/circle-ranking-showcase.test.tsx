import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CircleRankingShowcase from "@/components/ranking/circle-ranking-showcase";
import Story from "@/types/story";

// Mocking Next.js router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mocking Next.js Image
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ priority, ...props }: any) => <img {...props} />,
}));

// Mocking Link
vi.mock("@/components/link/Link", () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mocking DisplayStar
vi.mock("@/components/displays/ratings/display-star", () => ({
  __esModule: true,
  default: ({ rating }: any) => <div data-testid="display-star">{rating}</div>,
}));

// Mocking SVG Arrow icons
vi.mock("@/public/arrows/left-v.svg", () => ({
  __esModule: true,
  default: () => <span data-testid="arrow-left">‹</span>,
}));

vi.mock("@/public/arrows/right-v.svg", () => ({
  __esModule: true,
  default: () => <span data-testid="arrow-right">›</span>,
}));

// Mocking Loading
vi.mock("@/components/loadings/loading", () => ({
  __esModule: true,
  default: () => <div data-testid="loading-spinner" />,
}));

const mockStories: Story[] = [
  {
    id: "story-1",
    title: "One Piece",
    other_titles: ["Đảo Hải Tặc"],
    type: "manga",
    status: "ongoing",
    view: 150000,
    star: 4.9,
    summary: "Hành trình tìm kho báu One Piece của Luffy và băng Mũ Rơm.",
    cover_art: { path: "cover-op.jpg" },
    author: [{ name: "Eiichiro Oda" }],
    genres: ["Action", "Adventure"],
    number_of_children: 1100,
    children: [],
  },
  {
    id: "story-2",
    title: "Jujutsu Kaisen",
    other_titles: ["Chú Thuật Hồi Chiến"],
    type: "manga",
    status: "finished",
    view: 120000,
    star: 4.8,
    summary: "Cuộc chiến của các chú thuật sư chống lại nguyền hồn.",
    cover_art: { path: "cover-jjk.jpg" },
    author: [{ name: "Gege Akutami" }],
    genres: ["Action", "Supernatural"],
    number_of_children: 271,
    children: [],
  },
  {
    id: "story-3",
    title: "Overlord",
    other_titles: ["Kẻ Thống Trị"],
    type: "light_novel",
    status: "ongoing",
    view: 95000,
    star: 4.7,
    summary: "Ainz Ooal Gown chinh phục dị giới cùng lăng tẩm Nazarick.",
    cover_art: { path: "cover-overlord.jpg" },
    author: [{ name: "Kugane Maruyama" }],
    genres: ["Isekai", "Fantasy"],
    number_of_children: 16,
    children: [],
  },
];

describe("CircleRankingShowcase Component", () => {
  it("renders loading state when isLoading is true", () => {
    render(<CircleRankingShowcase stories={[]} isLoading={true} />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("renders Top 1 story initially with rank badge and info", () => {
    render(<CircleRankingShowcase stories={mockStories} />);

    // Check title of section
    expect(screen.getByText(/Top 8 Truyện Xem Nhiều Nhất/i)).toBeInTheDocument();

    // Check needle indicator "ĐANG CHỌN"
    expect(screen.getByText("ĐANG CHỌN")).toBeInTheDocument();

    // Check Top 1 story title
    expect(screen.getByText("One Piece")).toBeInTheDocument();
    expect(screen.getByText(/TOP 1 XEM NHIỀU NHẤT/i)).toBeInTheDocument();
    expect(screen.getByText("Eiichiro Oda")).toBeInTheDocument();

    // Check formatted views and chapters
    expect(screen.getByText("150.000")).toBeInTheDocument();
    expect(screen.getByText("1100")).toBeInTheDocument();
  });

  it("switches to next story when clicking next button", async () => {
    render(<CircleRankingShowcase stories={mockStories} />);

    const nextBtn = screen.getByRole("button", { name: "Truyện tiếp theo" });
    fireEvent.click(nextBtn);

    // After clicking next, second story (Jujutsu Kaisen) should become active
    await waitFor(() => {
      expect(screen.getByText("Jujutsu Kaisen")).toBeInTheDocument();
      expect(screen.getByText(/TOP 2 XEM NHIỀU NHẤT/i)).toBeInTheDocument();
    });
  });

  it("switches to previous story when clicking prev button", async () => {
    render(<CircleRankingShowcase stories={mockStories} />);

    const prevBtn = screen.getByRole("button", { name: "Truyện trước" });
    fireEvent.click(prevBtn);

    // After clicking prev from index 0, it wraps to last story (Overlord - Top 3)
    await waitFor(() => {
      expect(screen.getByText("Overlord")).toBeInTheDocument();
      expect(screen.getByText(/TOP 3 XEM NHIỀU NHẤT/i)).toBeInTheDocument();
    });
  });

  it("navigates to story details when clicking Read Now button", () => {
    render(<CircleRankingShowcase stories={mockStories} />);

    const readNowBtn = screen.getByText(/Đọc ngay/i);
    fireEvent.click(readNowBtn);

    expect(mockPush).toHaveBeenCalledWith("/stories/manga/story-1");
  });
});
