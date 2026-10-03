# Mangament Story Packer - Desktop App & CLI Tool

Ứng dụng Desktop GUI & CLI dùng để quét cấu trúc thư mục chứa truyện tranh trên máy / ổ đĩa, tự động tạo file `stories.csv` chuẩn định dạng và đóng gói vào file `.zip` hoàn chỉnh để nạp vào hệ thống Mangament (Batch Import).

---

## 1. Hướng Dẫn Sử Dụng Desktop GUI App (Giao Diện Bấm)

Di chuyển vào thư mục ứng dụng:

```bash
cd server/api/tools/pack-stories-zip
```

Khởi chạy ứng dụng Desktop:

```bash
npm start
```

### Các Tính Năng Trên Giao Diện:
- **📁 Chọn Thư Mục Nguồn (Browse...)**: Mở cửa sổ hệ điều hành chọn thư mục chứa các truyện tranh.
- **💾 Chọn Vị Trí Lưu ZIP**: Chọn file đích xuất ra (`.zip` hoặc `.csv`).
- **🔍 Lọc & Giới Hạn**: Nhập tên truyện cụ thể, giới hạn số lượng chapter hoặc số lượng truyện cần nén.
- **🗜️ Mức Độ Nén ZIP**: Chọn mức `0 - Store` (siêu tốc cho file ảnh JPG/PNG/WEBP) hoặc `1 - Fast`.
- **🖥️ Live Logs Terminal**: Theo dõi trực tiếp tiến trình quét đĩa, thống kê số lượng chapter/ảnh và tiến độ nén.

---

## 2. Hướng Dẫn Sử Dụng Dòng Lệnh (CLI Command)

Nếu muốn chạy bằng câu lệnh dòng lệnh (CLI):

```bash
# Chạy mặc định với giao diện CLI
npm run cli

# Chạy thử nghiệm mô phỏng (Dry-Run)
npm run dry-run

# Chạy với tốc độ đóng gói tối đa (--store)
npm run store -- -d "/path/to/Manga" -o full_manga.zip
```

---

## 3. Cấu Trúc Thư Mục Nguồn Được Hỗ Trợ

```text
/path/to/Manga/
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

## 4. Cấu Trúc File ZIP Đầu Ra

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
