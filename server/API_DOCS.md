# API Documentation

Tổng quan: server dùng Express, các route chính được mount như sau:

- `/auth` — xác thực
- `/users` — quản lý user
- `/stories` — truyện + ratings
- `/story-nodes` — chương/nút truyện
- `/authors` — tác giả
- `/genres` — thể loại
- `/comments` — bình luận
- `/admin` — admin (yêu cầu role)
- `/cloudinary` — tạo signature upload
- `/uploads` — upload (S3 / local)
- `/docs` — Swagger UI

Chú ý chung

- Header xác thực: `Authorization: Bearer <token>` (middleware `AuthenticationToken`).
- Một số route yêu cầu `AuthorizationRole` (admin/mod) — chỉ admin có quyền.
- Upload file: `multipart/form-data`. Trường ảnh thường là `image` hoặc `coverArt` hoặc `images`.
- Static files: thư mục `../uploads` được serve.

---

**Auth** (`/auth`)

- POST `/register` — Đăng ký
  - Body: `{ name, email, password, ... }`
  - Trả về: user + token
- POST `/login` — Đăng nhập
  - Body: `{ email, password }`
  - Trả về: access token, refresh token
- POST `/logout` — Đăng xuất
  - Header: `Authorization`
- POST `/refresh` — Refresh token
  - Body: `{ refreshToken }` (hoặc cookie)
- GET `/me` — Lấy thông tin user hiện tại
  - Header: `Authorization`

**Users** (`/users`)

- GET `/me` — Lấy profile (auth required)
- GET `/:id` — Lấy user theo id (auth + role required)
- GET `/` — Lấy danh sách users (auth + role required)
- PUT `/me` — Cập nhật profile (auth)
  - Body: cập nhật các trường user
- PUT `/:id` — Cập nhật user theo id (auth + role)
- PATCH `/me/password` — Đổi mật khẩu (auth)
  - Body: `{ oldPassword, newPassword }`
- DELETE `/:id` — Xóa user (auth + role)
- PATCH `/me/avatar` — Cập nhật avatar (auth)
  - multipart: `image` (file)

Favourite

- POST `/me/favourites` — Thêm vào favourites (auth)
  - Body: `{ storyId }` hoặc payload controller chấp nhận
- GET `/me/favourites` — Lấy favourites của user (auth)
- DELETE `/me/favourites/:id` — Xóa favourite (auth)

Reading history

- POST `/me/histories` — Thêm lịch sử đọc (auth)
- GET `/me/histories` — Lấy lịch sử đọc (auth)
- DELETE `/me/histories/:historyId` — Xóa lịch sử (auth)

**Stories** (`/stories`)

- GET `/random` — Lấy truyện ngẫu nhiên (optional auth)
- GET `/:id/review` — Lấy review cho truyện
- GET `/:id` — Lấy truyện theo id (optional auth)
- GET `/title/:title` — Tìm truyện theo title (optional auth)
- GET `/` — Lấy danh sách truyện (filters via query)
  - Query params thường có: `page`, `limit`, `genre`, `sort`, `q` (tùy impl)
- PATCH `/:id/view` — Tăng 1 lượt xem cho truyện
- POST `/` — Tạo truyện mới (auth + role)
  - multipart: `coverArt` (file)
  - Body: metadata truyện (title, authorId, type, status,...)

Ratings (thuộc stories)

- POST `/:id/ratings` — Thêm rating cho story (auth)
  - Body: `{ score, comment? }`
- GET `/:id/ratings/count` — Lấy tổng số rating cho story
- GET `/:id/ratings` — Lấy danh sách rating cho story
- PUT `/ratings/:id` — Cập nhật rating (auth)
- DELETE `/ratings/:id` — Xóa rating (auth)

**Story Nodes** (`/story-nodes`)

- GET `/:id` — Lấy story node theo id
- POST `/` — Tạo story node (auth + role)
  - Body: `{ storyId, title, content, order, ... }`
- PUT `/:id` — Cập nhật node (auth + role)
- PATCH `/:id/content` — Cập nhật nội dung kèm upload ảnh (auth + role)
  - multipart: `images` (array, up to 200)
- DELETE `/:id` — Xóa node (auth + role)
- PATCH `/:id/view` — Tăng 1 lượt view cho node

**Authors** (`/authors`)

- GET `/` — Lấy danh sách tác giả
- POST `/` — Tạo tác giả (auth + role)
  - multipart: `image` (nếu có)
- PUT `/:id` — Cập nhật tác giả (auth + role)
- DELETE `/:id` — Xóa tác giả (auth + role)

**Genres** (`/genres`)

- GET `/` — Lấy danh sách thể loại

**Comments** (`/comments`)

- GET `/story/:storyId` — Lấy comments cho story
- GET `/story/:storyId/story-node/:storyNodeId` — Lấy comments cho story node
- POST `/story/:storyId` — Thêm comment cho story (auth)
  - Body: `{ content, parentCommentId? }`
- POST `/story/:storyId/story-node/:storyNodeId` — Thêm comment cho story node (auth)
- PUT `/:id` — Cập nhật comment (auth)
- DELETE `/:id` — Xóa comment (auth)

**Cloudinary** (`/cloudinary`) — bảo vệ bằng `AuthenticationToken` + `AuthorizationRole`

- GET `/signature/story/:storyId/cover-art` — Tạo signature upload cover art
- GET `/signature/storyType/:storyType/storyTitle/:storyTitle/cover-art` — Tạo signature theo type+title
- GET `/signature/story-node/:storyNodeId/content` — Tạo signature để upload nội dung chương

**Uploads** (`/uploads`)

- POST `/user/me/avatar` — Upload avatar (auth)
  - multipart: `image`
- POST `/user/:userId/avatar` — Upload avatar cho user (auth + role)
- POST `/story/:storyId/cover-art` — Upload cover-art cho story (auth + role)
  - multipart: `image`
- POST `/story/:storyId/story-node/:storyNodeId/contents` — Upload nhiều ảnh cho story node (auth + role)
  - multipart: `images` (array)
- POST `/story/:storyId/story-node/:storyNodeId/content` — Upload 1 ảnh cho story node (auth + role)
  - multipart: `image`

**Admin** (`/admin`) — middleware `AuthenticationToken` + `AuthorizationRole` áp dụng cho toàn bộ route

- Users
  - GET `/users` — Lấy tất cả users
  - GET `/users/:id` — Lấy user
  - PUT `/users/:id` — Cập nhật user
  - DELETE `/users/:id` — Xóa user
  - PATCH `/users/:id/ban` — Ban user
- Dashboard
  - GET `/dashboard/overview` — Tổng quan dashboard
  - GET `/dashboard/stats/views` — Thống kê views trong khoảng
  - GET `/dashboard/stats/new-users` — Thống kê user mới
- Stories
  - GET `/stories/:id` — Lấy story (admin)
  - GET `/stories` — Lấy danh sách story (admin)
  - PUT `/stories/:id` — Cập nhật story (multipart `coverArt`)
  - POST `/stories` — Tạo story mới (multipart `coverArt`)
  - PATCH `/stories/:id/active` — Bật/tắt active story
  - DELETE `/stories/:id` — Xóa story
- Images
  - GET `/images/trash` — Lấy ảnh trong thùng rác

---

Ví dụ nhanh (curl)

- Login

```bash
curl -X POST https://your-host/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpass"}'
```

- Upload avatar (auth)

```bash
curl -X POST https://your-host/uploads/user/me/avatar \
  -H "Authorization: Bearer <token>" \
  -F "image=@/path/to/avatar.jpg"
```

---

Ghi chú / Next steps

- Nếu bạn muốn, tôi có thể: (1) bổ sung schema request/response cụ thể cho từng endpoint, (2) tạo Swagger (OpenAPI) đầy đủ từ controllers, hoặc (3) thêm ví dụ request/response cho các route quan trọng.
