/**
Component: CommentCard

Purpose:
Render a comment card that displays comment information.

Props:
- comment: Comment
- className: string
- onDelete: callback function

Behaviors to test:
1. Render comment card with comment information
2. Render title of this comment
3. Render content of this comment
4. Render user name for this comment
5. Render user avatar for this comment
6. Render created at for this comment
7. Delete button should display when onDelete is provided
8. Display modal when delete button is clicked
9. Do not call delete when modal is not confirmed
10. Call delete when modal is confirmed 
11. Must hide delete button if onDelete is not provided

Edge cases:
- onDelete is undefined
- multiple rapid clicks

Dependencies to mock:
- none
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CommentCard from "../components/cards/comment-card";
import Comment from "@/types/comment";
import { modal } from "../components/modal/modal.store";

// Mock dependencies
vi.mock("@/utils/convert", () => ({
  convertDateTo_yyyMMddHHmm: vi.fn(() => "2024-05-12 12:00"),
}));

vi.mock("@/public/trash.svg", () => ({
  default: ({ onClick, className }: any) => (
    <button data-testid="trash-icon" onClick={onClick} className={className}>
      Delete
    </button>
  ),
}));

vi.mock("../components/modal/modal.store", () => ({
  modal: {
    open: vi.fn(),
    close: vi.fn(),
  },
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, width, height }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} />
  ),
}));

const mockComment: Comment = {
  id: "1",
  story_id: "story-1",
  user_id: "user-1",
  title: "Great story!",
  content: "I really enjoyed reading this.",
  created_at: new Date("2024-05-12T12:00:00Z"),
  user: {
    id: "user-1",
    name: "John Doe",
    email: "john@example.com",
    role: "user",
    avatar: {
      id: "img-1",
      key: "avatars/john.png",
      url: "http://cdn.com/avatars/john.png",
    },
  },
};

describe("CommentCard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_CDN_URL = "http://localhost:3000";
  });

  it("1. Render comment card with comment information", () => {
    render(<CommentCard comment={mockComment} />);
    expect(screen.getByText(mockComment.title)).toBeInTheDocument();
    expect(screen.getByText(mockComment.content)).toBeInTheDocument();
  });

  it("2. Render title of this comment", () => {
    render(<CommentCard comment={mockComment} />);
    expect(screen.getByText(mockComment.title)).toBeInTheDocument();
  });

  it("3. Render content of this comment", () => {
    render(<CommentCard comment={mockComment} />);
    expect(screen.getByText(mockComment.content)).toBeInTheDocument();
  });

  it("4. Render user name for this comment", () => {
    render(<CommentCard comment={mockComment} />);
    expect(screen.getByText(mockComment.user!.name)).toBeInTheDocument();
  });

  it("5. Render user avatar for this comment", () => {
    render(<CommentCard comment={mockComment} />);
    const avatar = screen.getByAltText("Avatar");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute("src", expect.stringContaining("avatars/john.png"));
  });

  it("6. Render created at for this comment", () => {
    render(<CommentCard comment={mockComment} />);
    expect(screen.getByText("2024-05-12 12:00")).toBeInTheDocument();
  });

  it("7. Delete button should display when onDelete is provided", () => {
    const onDelete = vi.fn();
    render(<CommentCard comment={mockComment} onDelete={onDelete} />);
    expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
  });

  it("8. Display modal when delete button is clicked", () => {
    const onDelete = vi.fn();
    render(<CommentCard comment={mockComment} onDelete={onDelete} />);

    fireEvent.click(screen.getByTestId("trash-icon"));

    expect(modal.open).toHaveBeenCalledWith(
      "confirm",
      expect.objectContaining({
        title: "Xác nhận xóa",
      }),
    );
  });

  it("9. Do not call delete when modal is not confirmed", () => {
    const onDelete = vi.fn();
    render(<CommentCard comment={mockComment} onDelete={onDelete} />);

    fireEvent.click(screen.getByTestId("trash-icon"));

    const options = vi.mocked(modal.open).mock.calls[0][1] as any;
    options.onCancel();

    expect(modal.close).toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("10. Call delete when modal is confirmed", async () => {
    const onDelete = vi.fn();
    render(<CommentCard comment={mockComment} onDelete={onDelete} />);

    fireEvent.click(screen.getByTestId("trash-icon"));

    const options = vi.mocked(modal.open).mock.calls[0][1] as any;
    await options.onConfirm();

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(modal.close).toHaveBeenCalled();
  });

  it("11. Must hide delete button if onDelete is not provided", () => {
    render(<CommentCard comment={mockComment} />);
    expect(screen.queryByTestId("trash-icon")).not.toBeInTheDocument();
  });

  describe("Edge cases", () => {
    it("onDelete is undefined", () => {
      render(<CommentCard comment={mockComment} onDelete={undefined} />);
      expect(screen.queryByTestId("trash-icon")).not.toBeInTheDocument();
    });

    it("multiple rapid clicks on delete button", () => {
      const onDelete = vi.fn();
      render(<CommentCard comment={mockComment} onDelete={onDelete} />);

      const deleteButton = screen.getByTestId("trash-icon");
      fireEvent.click(deleteButton);
      fireEvent.click(deleteButton);
      fireEvent.click(deleteButton);

      expect(modal.open).toHaveBeenCalledTimes(3);
    });
  });
});
