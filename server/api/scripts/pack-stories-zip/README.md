# Script Đóng Gói Batch Import ZIP Cho Truyện Tranh

Script dùng để quét cấu trúc thư mục chứa truyện tranh trên máy / ổ đĩa (tương tự `upload-stories`), tự động tạo file `stories.csv` chuẩn định dạng và nén tất cả vào một file `.zip` hoàn chỉnh để đưa lên API batch import của hệ thống Mangament.

---

## 1. Cấu trúc thư mục nguồn được hỗ trợ

Script đọc cấu trúc thư mục theo tiêu chuẩn sau:

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
│   └── volume 1/              (Hỗ trợ chapter, volume, arc, tập, hồi, chương)
│       └── ...
└── ...
```

---

## 2. Cấu trúc bên trong file ZIP được sinh ra

File `.zip` tạo ra tuân thủ chính xác quy chuẩn của Worker Batch Import:

```text
manga_batch.zip
├── stories.csv
└── <Tên Truyện>/
    ├── cover_art.jpg
    ├── chapter 01/
    │   ├── 000.jpg
    │   ├── 001.jpg
    │   └── ...
    └── chapter 02/
        └── ...
```

Trong file `stories.csv`:

- `cover_art_path`: `<Tên Truyện>/cover_art.jpg` (đường dẫn tương đối từ vị trí file CSV).
- `story_node_content_image_path`: `<Tên Truyện>/chapter 01/000.jpg`.

---

## 3. Cách sử dụng

Di chuyển vào thư mục script:

```bash
cd server/api/scripts/pack-stories-zip
```

### A. Chạy thử nghiệm mô phỏng (Dry-Run)

Kiểm tra số lượng truyện, chapter, ảnh và xem trước nội dung file CSV mà không tạo file zip:

```bash
node index.js --dry-run
```

### B. Đóng gói nhanh 1 truyện cụ thể để test (Ví dụ: 2 chapter đầu)

```bash
node index.js --story "Genshin Impact" --chapters 2 -o genshin_sample.zip
```

### C. Đóng gói toàn bộ truyện với tốc độ cao nhất (--store)

Vì các file JPG/PNG/WEBP vốn đã là định dạng nén sẵn, tùy chọn `--store` (mức nén 0) sẽ chỉ đóng gói archive mà không tốn CPU nén lại, giúp xuất file zip hàng chục GB chỉ trong vài chục giây:

```bash
node index.js -d "/path/to/Manga" --store -o full_manga.zip
```

### D. Chỉ xuất file `stories.csv` (không nén zip)

```bash
node index.js --csv-only -o stories.csv
```

---

## 4. Danh sách các tham số dòng lệnh (CLI Options)

| Tham số               | Viết tắt |             Mặc định              | Mô tả                                                            |
| :-------------------- | :------: | :-------------------------------: | :--------------------------------------------------------------- |
| `--dir <path>`        |   `-d`   | `/run/media/khoa/6FF9-2D8B/Manga` | Đường dẫn thư mục gốc chứa truyện                                |
| `--output <path>`     |   `-o`   |        `./manga_batch.zip`        | Đường dẫn file zip xuất ra                                       |
| `--story <name>`      |   `-s`   |              `null`               | Lọc theo tên truyện cụ thể (tìm kiếm không phân biệt hoa/thường) |
| `--limit <num>`       |   `-l`   |           `0` (Tất cả)            | Giới hạn số lượng truyện quét                                    |
| `--chapters <num>`    |   `-c`   |              `null`               | Giới hạn số chapter tối đa cho mỗi truyện                        |
| `--compression <0-9>` |          |                `1`                | Mức độ nén của ZIP (0 = Store, 1 = Fast, 6 = Mặc định)           |
| `--store`             |          |                                   | Phím tắt cho `--compression 0` (tốc độ ghi đĩa tối đa cho ảnh)   |
| `--fast`              |          |                                   | Phím tắt cho `--compression 1` (nén nhanh)                       |
| `--dry-run`           |          |              `false`              | Chạy mô phỏng, xem trước bảng thống kê và 12 dòng CSV đầu tiên   |
| `--csv-only`          |          |              `false`              | Chỉ tạo file CSV, không tạo file zip                             |
| `--keep-temp`         |          |              `false`              | Giữ lại thư mục staging tạm thời sau khi nén                     |
| `--help`              |   `-h`   |                                   | Hiển thị trợ giúp                                                |

---

## 5. Ưu điểm kỹ thuật

- **Không tốn thêm dung lượng đĩa cho thư mục tạm**: Tận dụng cơ chế symlink trong thư mục staging, lệnh `zip` tự động theo dấu và nén file thật vào archive mà không phải copy ảnh sang thư mục tạm.
- **Hỗ trợ file cực lớn**: Sử dụng Info-ZIP 3.0 với hỗ trợ định dạng ZIP64 cho file zip trên 4GB.
- **Khớp hoàn hảo với Backend API**: File zip sinh ra có thể tải trực tiếp lên API `POST /admin/stories/upload-zip` hoặc đưa lên Cloud Storage và nạp qua `POST /admin/stories/download-zip`.
