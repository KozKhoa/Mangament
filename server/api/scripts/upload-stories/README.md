# Script Upload Stories từ Cấu Trúc Thư Mục Ổ Đĩa

Script dùng để quét cấu trúc thư mục chứa truyện tranh trên ổ đĩa và tự động nạp dữ liệu vào Database (`Story`, `StoryNode`, `StoryNodeContent`, `Image`).

## 1. Cấu trúc thư mục được hỗ trợ

Script được thiết kế để phân tích cấu trúc theo quy chuẩn:

```text
/run/media/khoa/6FF9-2D8B/Manga/
├── <Tên Truyện>/
│   ├── cover_art.jpg          (Ảnh bìa của truyện - Tùy chọn)
│   ├── chapter 01/            (<loại node> <thứ tự node>)
│   │   ├── 000.jpg            (Trang ảnh)
│   │   ├── 001.jpg
│   │   └── ...
│   ├── chapter 02/
│   │   ├── 000.jpg
│   │   └── ...
│   └── volume 1/              (Hỗ trợ cả chapter, volume, arc)
│       └── ...
└── ...
```

### Quy tắc nhận diện:

- **Tên truyện (`title`)**: Lấy theo tên thư mục cấp 1 (ví dụ: `Chainsaw Man`, `Genshin Impact`).
- **Ảnh bìa (`cover_art`)**: Tự động nhận diện file `cover_art.jpg`, `cover_art.jpeg`, `cover_art.png`, `cover.jpg`... nếu có trong thư mục truyện.
- **Phân cấp node (`StoryNode`)**: Nhận diện tiền tố (`chapter`, `volume`, `arc`, `chương`, `tập`, `hồi`) và số thứ tự (`01`, `1`, `1.5`,...).
- **Nội dung trang (`StoryNodeContent`)**: Lọc toàn bộ các file ảnh (`.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`), tự động sắp xếp theo thứ tự số tự nhiên (`000.jpg`, `001.jpg`,..., `010.jpg`), đọc kích thước qua `sharp` và sao chép vào `server/public/images/stories/`.

---

## 2. Hướng dẫn sử dụng

Di chuyển vào thư mục script:

```bash
cd server/api/scripts/upload-stories
```

### A. Chạy thử nghiệm (Dry-Run - Không ghi vào Database)

Khuyên dùng trước khi nạp thật để kiểm tra số lượng truyện, chapters và trang ảnh:

```bash
node index.js --dry-run
```

### B. Nạp thật tất cả truyện lần lượt (Mặc định)

```bash
node index.js
```

### C. Nạp 1 truyện cụ thể (kèm giới hạn số chapter để test)

```bash
node index.js --story "Genshin Impact" --chapters 2
```

### D. Giới hạn số lượng truyện nếu cần

```bash
node index.js --limit 5
```

---

## 3. Danh sách các tham số dòng lệnh (CLI Options)

| Tham số                   | Viết tắt |             Mặc định              | Mô tả                                                                                         |
| :------------------------ | :------: | :-------------------------------: | :-------------------------------------------------------------------------------------------- |
| `--dir <path>`            |   `-d`   | `/run/media/khoa/6FF9-2D8B/Manga` | Đường dẫn thư mục gốc chứa truyện                                                             |
| `--limit <num>`           |   `-l`   |           `0` (Toàn bộ)           | Số lượng truyện cần quét (mặc định: 0 = quét hết)                                             |
| `--story <name>`          |   `-s`   |              `null`               | Lọc theo tên truyện cụ thể (không phân biệt hoa/thường)                                       |
| `--chapters <num>`        |   `-c`   |              `null`               | Giới hạn số chapter quét cho mỗi truyện                                                       |
| `--public-dir, -p <path>` |   `-p`   | `PUBLIC_DIR` hoặc `server/public` | Thư mục public lưu trữ (ảnh sẽ lưu tại `<public-dir>/images/stories`, có thể nằm ổ cứng khác) |
| `--dry-run`               |          |              `false`              | Chạy thử mô phỏng, không copy file và không ghi DB                                            |
| `--no-copy`               |          |              `false`              | Không copy file ảnh vào thư mục lưu trữ                                                       |
| `--help`                  |   `-h`   |                                   | Hiển thị hướng dẫn sử dụng                                                                    |

---

## 4. Cơ chế an toàn (Safety & Idempotency)

- **Tránh trùng lặp truyện**: Nếu truyện đã có trong DB (`Story.title`), script sẽ tái sử dụng ID hiện có.
- **Tránh trùng lặp Chapter**: Nếu chapter đã có (`story_id`, `type`, `order_index`), script sẽ dùng lại chapter đó.
- **Tránh nhân bản trang ảnh**: Nếu chapter đã có đủ số lượng bản ghi content tương ứng, script sẽ tự động bỏ qua để tránh chèn đè.
- **Tối ưu hiệu năng**: Tạo bản ghi `Image` và `StoryNodeContent` theo lô (`createMany`) với UUID được tạo trước, giúp việc import hàng ngàn trang ảnh chỉ mất vài giây.
