# UI & Frontend Design Guidelines for Agent

File này định nghĩa toàn bộ quy tắc thiết kế UI, kiến trúc component và chuẩn giao diện cho Agent khi làm việc trong thư mục `client/` (Next.js 16+, React 19, Tailwind CSS v4).

---

## 1. Kiến trúc Next.js App Router & React 19

- **Mặc định là React Server Components (RSC):**
  - Mọi page/layout/component mặc định giữ là Server Component nếu chỉ render cấu trúc hoặc fetch dữ liệu từ server.
- **Client Components (`"use client"`):**
  - Chỉ thêm `"use client"` khi component thực sự cần:
    - React Hooks (`useState`, `useEffect`, `useRef`, `useContext`, custom hooks).
    - Event handlers (`onClick`, `onChange`, `onSubmit`, `onDragEnd`...).
    - Tương tác với browser APIs hoặc animation thư viện (`framer-motion`, `@dnd-kit`, `@floating-ui`).
  - **Tối ưu cây component:** Không bao giờ gắn `"use client"` lên cả page lớn. Hãy tách các khối tương tác nhỏ (button, dropdown, form modal) thành Client Component riêng.

---

## 2. Hệ thống Design Tokens & Theme (Tailwind CSS v4)

Dự án sử dụng hệ thống màu CSS Variables và Tailwind Theme mở rộng tại `client/app/globals.css` và `client/tailwind.config.ts`.

- **Màu sắc ngữ nghĩa (Semantic Colors):**
  - Nền chính: `bg-background` (tương ứng Light: `#efede9` / Dark: `#2b2b2b`).
  - Nền card/item: `bg-background-items` (Light: `#faf9f6` / Dark: `#1f1f1f`).
  - Màu chữ chính: `text-foreground` (Light: `#171717` / Dark: `#ffffff`).
  - Nút bấm trạng thái:
    - Chấp nhận / Action chính: `bg-accept-button` (`#3a606e`) hoặc `bg-foreground`.
    - Từ chối / Huỷ: `bg-reject-button` (`#fc814a`) hoặc `bg-red-500`.
    - Cảnh báo: `bg-warning-button` (`#db9065`).
    - Lỗi: `text-error` / `bg-error`.
  - **TUYỆT ĐỐI KHÔNG** hardcode các mã màu hex ngẫu nhiên khi dựng layout mới, hãy tận dụng các biến trên để bảo đảm Dark/Light mode hoạt động chuẩn xác.

- **Typography & Font:**
  - Font mặc định dự án là `font-afacad`.
  - Các font phụ hỗ trợ: `font-holtwood`, `font-aclonica`, `font-geist`, `font-geist_mono`.

- **Animations có sẵn:**
  - Sử dụng class: `animate-fade-in`, `animate-slide-in`, `animate-border-move`.
  - Hiệu ứng cắt giấy (nếu dùng): `clip-path-paper`.

- **Responsive & Container Queries:**
  - Thiết kế theo hướng **Mobile-First**.
  - Sử dụng responsive breakpoints chuẩn: `sm:`, `md:`, `lg:`, `xl:`.
  - Dự án hỗ trợ `@tailwindcss/container-queries` với `@sm`, `@md`, `@lg` cho các component độc lập kích thước màn hình.

---

## 3. Tái sử dụng Component Thư viện nội bộ (`client/components/`)

Trước khi tạo mới bất kỳ UI component nào, **BẮT BUỘC KIỂM TRA** xem thư mục `client/components/` đã có sẵn hay chưa:

- **Nút bấm:** `client/components/buttons/` (`button.tsx`, `favourite-button.tsx`, `dropdown/`, `expandable/`).
- **Input & Form:** `client/components/inputs/`, `client/components/forms/`, `client/components/selections/`, `client/components/search/`.
- **Loading:** `client/components/loadings/loading.tsx`.
- **Modal & Popup:** `client/components/modal/`.
- **Dữ liệu & Layout:** `client/components/table/`, `client/components/cards/`, `client/components/grids/`, `client/components/layouts/`, `client/components/list/`.
- **Sắp xếp & Lọc:** `client/components/filters/`, `client/components/sorts/`.
- **Kéo thả:** `client/components/draggable/` (dùng `@dnd-kit`).
- **Thông báo (Toasts):** Sử dụng thư viện `sonner`. Không dùng `alert()` hoặc prompt mặc định của browser.

---

## 4. Xử lý bắt buộc các trạng thái giao diện (UI States)

Mọi component/màn hình có tải hoặc tương tác dữ liệu phải đảm bảo 4 trạng thái:

1. **Loading State:** Sử dụng component trong `client/components/loadings/` hoặc Skeleton, Suspense boundary.
2. **Error State:** Hiển thị thông báo lỗi rõ ràng, kèm hành động phục hồi (nút Thử lại / Quay về).
3. **Empty State:** Hiển thị icon/hình ảnh và thông điệp hướng dẫn khi danh sách/dữ liệu rỗng.
4. **Interactive States:** Mọi button, link, switch phải có rõ `hover:`, `active:`, `focus-visible:`, và `disabled:opacity-50 disabled:cursor-not-allowed`.

---

## 5. Quy chuẩn Viết mã & Accessibility (a11y)

- **TypeScript:** Định nghĩa type rõ ràng cho `props`, tránh lạm dụng `any`. Ưu tiên tái sử dụng type từ `client/types/`.
- **Semantic HTML:** Sử dụng thẻ ngữ nghĩa (`<main>`, `<section>`, `<nav>`, `<header>`, `<footer>`, `<button>`).
- **Icon-only Button:** Luôn bổ sung `aria-label` và `title` để đảm bảo trợ năng (accessibility).
- **Tránh thư viện thừa:** Không tự ý cài đặt thêm thư viện CSS hay UI framework khác (như Material UI, Chakra UI, Ant Design).
