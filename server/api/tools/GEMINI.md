# UI guidelines

- Stack: React + Tailwind + shadcn/ui. Chỉ dùng component shadcn, không tự viết lại.
- Phong cách: tối giản, phẳng, bo góc 6-8px (--radius: 0.5rem), không gradient, không đổ bóng nặng.
- Một màu nhấn duy nhất (primary) cho nút hành động chính; còn lại dùng neutral/zinc.
- Icon: lucide-react. Font: Inter hoặc font hệ thống; dùng font-mono cho tên file.
- Hỗ trợ dark mode bằng CSS variables của shadcn.
- Bố cục: bảng file (data-table) ở giữa, panel quy tắc bên cạnh, thanh trạng thái + nút chính ở dưới.
- Bắt buộc: preview "tên cũ → tên mới", đánh dấu file trùng/lỗi, nút Undo, progress khi đóng gói, kéo thả folder.
- Mật độ thông tin vừa phải, ưu tiên rõ ràng hơn trang trí.
