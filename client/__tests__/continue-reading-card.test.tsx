import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ContinueReadingCard from "@/components/cards/continue-reading-card";
import historyService from "@/services/history";
import History from "@/types/history";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ priority, fill, ...props }: any) => <img {...props} />,
}));

vi.mock("@/services/history", () => ({
  __esModule: true,
  default: {
    removeHistory: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    warning: vi.fn(),
    message: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/public/trash.svg", () => ({
  __esModule: true,
  default: ({ className }: any) => <span data-testid="trash-icon" className={className} />,
}));

const mockHistory: History = {
  id: "history-1",
  user_id: "user-1",
  created_at: new Date("2026-09-20T10:00:00Z"),
  updated_at: new Date("2026-09-23T14:00:00Z"),
  story: {
    id: "story-1",
    title: "Chainsaw Man",
    type: "manga",
    status: "ongoing",
    cover_art: { path: "/covers/csm.jpg" },
    number_of_children: 150,
    children: [],
  },
  story_node: {
    id: "chapter-5",
    story_id: "story-1",
    title: "Súng Quỷ",
    type: "chapter",
    order_index: 5,
    created_at: new Date(),
    updated_at: new Date(),
  },
};

describe("ContinueReadingCard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders cover art image and badges correctly", () => {
    render(<ContinueReadingCard history={mockHistory} />);

    const img = screen.getByAltText("Chainsaw Man");
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toContain("/covers/csm.jpg");

    expect(screen.getByText("Chainsaw Man")).toBeInTheDocument();
    expect(screen.getByText(/Chapter 5/i)).toBeInTheDocument();
  });

  it("calculates progress percentage correctly", () => {
    render(<ContinueReadingCard history={mockHistory} />);

    // 5 / 150 ~ 3%
    expect(screen.getByText(/3%/i)).toBeInTheDocument();
    expect(screen.getByText(/5\/150 ch/i)).toBeInTheDocument();
  });

  it("navigates to chapter when clicking card or Continue button", () => {
    render(<ContinueReadingCard history={mockHistory} />);

    const continueBtn = screen.getByText(/Đọc tiếp/i);
    fireEvent.click(continueBtn);

    expect(mockPush).toHaveBeenCalledWith("/stories/manga/story-1/chapter-5");
  });

  it("handles remove history successfully", async () => {
    (historyService.removeHistory as any).mockResolvedValue({ success: true, message: "OK" });
    const onClickRemoveMock = vi.fn();

    render(<ContinueReadingCard history={mockHistory} onClickRemove={onClickRemoveMock} />);

    const trashBtn = screen.getByTitle("Xóa khỏi lịch sử đọc");
    fireEvent.click(trashBtn);

    await waitFor(() => {
      expect(historyService.removeHistory).toHaveBeenCalledWith("history-1");
      expect(onClickRemoveMock).toHaveBeenCalled();
    });
  });

  it("renders placeholder when story has no cover art", () => {
    const historyNoCover: History = {
      ...mockHistory,
      story: {
        ...mockHistory.story!,
        cover_art: undefined as any,
      },
    };

    render(<ContinueReadingCard history={historyNoCover} />);
    expect(screen.getByText("Không có ảnh")).toBeInTheDocument();
  });
});
