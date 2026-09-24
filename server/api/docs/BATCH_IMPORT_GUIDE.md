# Hướng Dẫn Cấu Trúc File Bảng Tính (.CSV / .XLSX / .XLS) Cho Batch Import Truyện

Tài liệu này hướng dẫn chi tiết quy cách thiết kế file bảng tính (`.csv`, `.xlsx`, `.xls`) để thực hiện tải lên và tạo truyện hàng loạt qua API:

- **Endpoint Upload Bảng tính (.csv/.xlsx)**: `POST /admin/stories`
- **Endpoint Upload File ZIP (.zip)**: `POST /admin/stories/upload-zip` (hoặc gửi file `.zip` đến `POST /admin/stories`)
- **Endpoint Download & Import File ZIP từ URL**: `POST /admin/stories/download-zip`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data` (đối với Upload) hoặc `application/json` (đối với Download ZIP)
- **Tên field file upload**: `file`
- **Dung lượng**: Không giới hạn RAM (Stream trực tiếp vào `diskStorage` của `TEMP_DIR` cho file zip lên đến hàng chục GB)
- **Định dạng hỗ trợ**: `.csv`, `.xlsx`, `.xls`, `.zip`

---

## 0. API Tải File Mẫu (Download Template API)

Backend cung cấp sẵn API cho Frontend và người dùng tải trực tiếp file mẫu chuẩn:

- **Endpoint**: `GET /admin/stories/import-template`
- **Method**: `GET`
- **Query Parameters**:
  - `format`: `xlsx` (mặc định) hoặc `csv`.
  - `type`:
    - `full` (mặc định): Mẫu đầy đủ 28 cột chuẩn (Truyện + Volume + Chapter).
    - `story_only`: Mẫu chỉ import danh mục truyện (không có chapter).
    - `chapters_only`: Mẫu bổ sung chapter vào truyện đã có sẵn trong hệ thống.
- **Ví dụ gọi API**:
  - Tải file Excel mẫu đầy đủ: `GET /admin/stories/import-template`
  - Tải file CSV mẫu chỉ có truyện: `GET /admin/stories/import-template?format=csv&type=story_only`
  - Tải file Excel mẫu thêm chapter: `GET /admin/stories/import-template?format=xlsx&type=chapters_only`
- **Frontend tích hợp**: Chỉ cần đặt liên kết tải trực tiếp:
  ```html
  <a href="/api/admin/stories/import-template?format=xlsx&type=full" download> Tải file mẫu Excel </a>
  ```

---

## 1. Nguyên tắc thiết kế & Độ linh hoạt

Hệ thống được thiết kế theo cơ chế **Dynamic Schema**, cho phép:

1. **Tự do đổi thứ tự cột**: Các cột có thể xuất hiện ở bất kỳ vị trí nào, hệ thống nhận diện theo tên tiêu đề (header) ở dòng đầu tiên.
2. **Bỏ bớt cột không cần thiết**: Các cột không có dữ liệu có thể xóa bỏ hoàn toàn khỏi file.
3. **Hỗ trợ N cấp độ StoryNode**: Không giới hạn chỉ 2 cấp; có thể tạo 3, 4 hoặc N cấp phân nhánh (ví dụ: _Arc $\rightarrow$ Volume $\rightarrow$ Chapter $\rightarrow$ Part_).
4. **Tự động gắn vào truyện có sẵn**: Khi muốn bổ sung chapter mới cho một truyện đã có trên hệ thống, chỉ cần cung cấp cột `title` của truyện và các cột node tương ứng.

---

## 2. Bảng định nghĩa các trường dữ liệu (Headers Specification)

### A. Thông tin Truyện (Story Columns)

| Tên cột (Header)                     | Bắt buộc? |  Kiểu dữ liệu  | Giá trị mặc định | Mô tả & Lưu ý                                                                                                                                                                                                                                                         |
| :----------------------------------- | :-------: | :------------: | :--------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title` hoặc `story_title`           |  **Có**   | Chuỗi (String) |    _(Không)_     | Tên truyện (Unique). Nếu truyện đã có trong DB, hệ thống sẽ sử dụng lại và gắn node mới vào.                                                                                                                                                                          |
| `other_title` hoặc `other_titles`    |   Không   | Chuỗi (String) |       `[]`       | Tên khác của truyện. Hỗ trợ phân cách nhiều tên bằng dấu `,` hoặc `;` hoặc `\|`.                                                                                                                                                                                      |
| `story_type` hoặc `type`             |   Không   |      Enum      |     `manga`      | Loại truyện: `manga`, `light_novel` (hoặc `novel`).                                                                                                                                                                                                                   |
| `story_status` hoặc `status`         |   Không   |      Enum      |    `ongoing`     | Trạng thái phát hành: `ongoing`, `finished`, `postpone`, `upcoming`.                                                                                                                                                                                                  |
| `nation_id`                          |   Không   |      UUID      |      `null`      | UUID của quốc gia trong bảng `Nation`. Ưu tiên cao nhất nếu cung cấp.                                                                                                                                                                                                 |
| `nation` hoặc `country`              |   Không   | Chuỗi (String) |      `null`      | Tên quốc gia (ví dụ: `Japan`, `Korea`, `Vietnam`). Nếu `nation_id` trống, hệ thống sẽ tự tìm kiếm theo tên này.                                                                                                                                                       |
| `genres` hoặc `story_genres`         |   Không   | Chuỗi (String) |       `[]`       | Danh sách tên các thể loại cách nhau bằng dấu phẩy (ví dụ: `Action,Detective,Romance`). Hệ thống tự động tìm kiếm theo tên thể loại (không phân biệt hoa thường, `genre.name` là unique) và liên kết vào truyện. Thể loại nào không tồn tại sẽ tự động bỏ qua (skip). |
| `author_ids` hoặc `story_author_ids` |   Không   | Chuỗi (UUIDs)  |       `[]`       | Danh sách UUID của tác giả cách nhau bằng dấu phẩy, không có dấu cách ở giữa (ví dụ: `uuid-1,uuid-2,uuid-3`). Nếu UUID tác giả tồn tại trong DB sẽ được gắn vào truyện; nếu không tồn tại sẽ tự động bỏ qua (skip).                                                   |
| `deleted_status` (Story)             |   Không   |      Enum      |  `not_deleted`   | Trạng thái xóa: `not_deleted`, `soft_deleted`.                                                                                                                                                                                                                        |
| `is_actived` hoặc `is_active`        |   Không   |    Boolean     |      `true`      | Trạng thái kích hoạt: `true`/`false`, `1`/`0`, `yes`/`no`.                                                                                                                                                                                                            |
| `summary` hoặc `description`         |   Không   | Chuỗi (String) |      `null`      | Nội dung tóm tắt cốt truyện.                                                                                                                                                                                                                                          |
| `cover_art_id`                       |   Không   |      UUID      |      `null`      | UUID của ảnh bìa trong bảng `Image`. Nếu rỗng hoặc ID không tồn tại sẽ tự động lưu `null`.                                                                                                                                                                            |
| `cover_art_path`                     |   Không   | Chuỗi (String) |      `null`      | Đường dẫn tương đối đến file ảnh bìa tính từ vị trí file CSV trong file ZIP (ví dụ: `covers/naruto.jpg` hoặc `./images/cover.png`). Worker sẽ tự động import vào `PUBLIC_DIR/images/stories`, tạo bản ghi bảng `Image` (`provider: "local"`) và liên kết vào truyện.  |

---

### B. Thông tin Phân Cấp Truyện (StoryNode Columns)

Có **2 cách đặt tên tiêu đề** cho các tầng node:

- **Cách 1 (Lặp lại tên header)**: Dùng cùng tên header, hệ thống tự hiểu tầng node theo thứ tự xuất hiện từ trái qua phải (như mẫu 28 cột chuẩn).
- **Cách 2 (Đánh số tường minh)**: Dùng tiền tố `node_1_...`, `node_2_...`, `node_3_...` (khuyên dùng khi thiết kế file phức tạp nhiều tầng).

| Tiêu đề Cách 1 (Lặp lại) | Tiêu đề Cách 2 (Đánh số Cấp $K$)             | Bắt buộc? |  Kiểu dữ liệu  |             Giá trị mặc định              | Mô tả & Phân cấp                                         |
| :----------------------- | :------------------------------------------- | :-------: | :------------: | :---------------------------------------: | :------------------------------------------------------- |
| `story_node_title`       | `node_{k}_title` hoặc `story_node_{k}_title` |   Không   |     Chuỗi      |                  `null`                   | Tiêu đề của node (ví dụ: `Tập 1`, `Hồi 1`, `Chương 10`). |
| `story_node_type`        | `node_{k}_type` hoặc `story_node_{k}_type`   |   Không   |      Enum      | Cấp 1: `volume`<br>Cấp $\ge 2$: `chapter` | Loại node: `volume`, `arc`, `chapter`.                   |
| `story_node_order_index` | `node_{k}_order_index`                       |   Không   | Số (Float/Int) |                    `1`                    | Thứ tự hiển thị của node trong danh sách cùng cấp.       |
| `deleted_status`         | `node_{k}_deleted_status`                    |   Không   |      Enum      |               `not_deleted`               | Trạng thái xóa của node: `not_deleted`, `soft_deleted`.  |

> **Quy tắc quan hệ cha - con (`parent_id`)**:
>
> - Node Cấp 1 ($k=1$): Có `parent_id = null` (Node gốc trực thuộc Story).
> - Node Cấp 2 ($k=2$): Tự động gán `parent_id = ID của Node Cấp 1`.
> - Node Cấp 3 ($k=3$): Tự động gán `parent_id = ID của Node Cấp 2`.

---

### C. Nội Dung Của Node (StoryNodeContent Columns)

Một node có thể có hoặc không có nội dung kèm theo. Nếu các cột nội dung bị bỏ trống, hệ thống sẽ chỉ tạo Node mà không tạo bản ghi nội dung.

| Tiêu đề Cách 1 (Lặp lại)            | Tiêu đề Cách 2 (Đánh số Cấp $K$)  | Bắt buộc? | Kiểu dữ liệu |             Giá trị mặc định             | Mô tả                                                                                                                                                                                                                             |
| :---------------------------------- | :-------------------------------- | :-------: | :----------: | :--------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `story_node_content_order_index`    | `node_{k}_content_order_index`    |   Không   |   Số (Int)   |                   `1`                    | Thứ tự của đoạn nội dung / trang truyện.                                                                                                                                                                                          |
| `story_node_content_type`           | `node_{k}_content_type`           |   Không   |     Enum     | Có image: `image`<br>Không image: `text` | Loại nội dung: `text`, `image`, `header`, `title`.                                                                                                                                                                                |
| `story_node_content_content`        | `node_{k}_content_content`        |   Không   |    Chuỗi     |                  `null`                  | Đoạn văn bản, lời thoại hoặc nội dung text của chương.                                                                                                                                                                            |
| `story_node_content_image_id`       | `node_{k}_content_image_id`       |   Không   |     UUID     |                  `null`                  | UUID của ảnh trang truyện trong bảng `Image`.                                                                                                                                                                                     |
| `story_node_content_image_path`     | `node_{k}_content_image_path`     |   Không   | Chuỗi (Path) |                  `null`                  | Đường dẫn tương đối đến file ảnh trang truyện tính từ vị trí file CSV trong file ZIP (ví dụ: `chapters/c1/p01.jpg`). Worker tự động import ảnh vào `PUBLIC_DIR/images/stories`, tạo bản ghi bảng `Image` và gán `type = "image"`. |
| `story_node_content_deleted_status` | `node_{k}_content_deleted_status` |   Không   |     Enum     |              `not_deleted`               | Trạng thái xóa của nội dung: `not_deleted`, `soft_deleted`.                                                                                                                                                                       |

---

## 3. Các mẫu File CSV tiêu biểu theo tình huống

### Mẫu 1: Đầy đủ 2 cấp chuẩn (28 Cột)

Dành cho trường hợp import đầy đủ từ Truyện $\rightarrow$ Volume (Cấp 1) $\rightarrow$ Chapter (Cấp 2):

```csv
title,other_title,story_type,story_status,nation_id,nation,deleted_status,is_actived,summary,cover_art_id,story_node_title,story_node_type,story_node_order_index,deleted_status,story_node_content_order_index,story_node_content_type,story_node_content_content,story_node_content_image_id,story_node_content_deleted_status,story_node_title,story_node_type,story_node_order_index,deleted_status,story_node_content_order_index,story_node_content_type,story_node_content_content,story_node_content_image_id,story_node_content_deleted_status
Solo Leveling,"Tôi Thăng Cấp Một Mình, I Alone Level Up",manga,finished,,Korea,not_deleted,true,"Sung Jin-woo thức tỉnh sức mạnh",,Season 1,volume,1,not_deleted,,,,,,Chapter 1,chapter,1,not_deleted,1,image,,11111111-1111-4111-8111-111111111111,not_deleted
Solo Leveling,"Tôi Thăng Cấp Một Mình, I Alone Level Up",manga,finished,,Korea,not_deleted,true,"Sung Jin-woo thức tỉnh sức mạnh",,Season 1,volume,1,not_deleted,,,,,,Chapter 2,chapter,2,not_deleted,1,image,,22222222-2222-4222-8222-222222222222,not_deleted
```

---

### Mẫu 2: Chỉ import thông tin Truyện (Không có Node)

Dành cho trường hợp khởi tạo danh mục truyện trước, chapter sẽ thêm sau:

```csv
title,other_title,story_type,story_status,nation,genres,author_ids,summary,is_actived
One Piece,Vua Hải Tặc,manga,ongoing,Japan,"Action,Adventure,Comedy","11111111-1111-4111-8111-111111111111,22222222-2222-4222-8222-222222222222","Hành trình tìm kho báu One Piece của Luffy",true
Doraemon,Chú Mèo Máy Đến Từ Tương Lai,manga,finished,Japan,"Comedy,Sci-Fi",,"Câu chuyện về chú mèo máy Doraemon và Nobita",true
Lord of the Mysteries,Quỷ Bí Chi Chủ,light_novel,finished,China,"Fantasy,Mystery",,"Hành trình thăng tiến của Klein Moretti trong thế giới steampunk ma thuật",true
```

---

### Mẫu 3: Bổ sung Chapter mới vào Truyện đã có sẵn trong hệ thống

Chỉ cần cung cấp cột `title` để hệ thống tìm truyện hiện có, kèm theo thông tin Chapter cần thêm:

```csv
title,story_node_title,story_node_type,story_node_order_index,story_node_content_type,story_node_content_content
One Piece,Chapter 1110,chapter,1110,text,"Nội dung spoiler hoặc text của chap 1110"
One Piece,Chapter 1111,chapter,1111,text,"Nội dung spoiler hoặc text của chap 1111"
```

---

### Mẫu 4: Cấu trúc 3 tầng phân cấp rõ ràng (Dùng tiêu đề đánh số)

Cấu trúc: Phần (Arc) $\rightarrow$ Tập (Volume) $\rightarrow$ Chương (Chapter):

```csv
title,node_1_title,node_1_type,node_1_order_index,node_2_title,node_2_type,node_2_order_index,node_3_title,node_3_type,node_3_order_index,node_3_content_type,node_3_content_content
Tam Quốc Diễn Nghĩa,Hồi 1-10,arc,1,Quyển 1,volume,1,Hồi 1,chapter,1,text,"Yến Đào Viên ba anh em kết nghĩa..."
Tam Quốc Diễn Nghĩa,Hồi 1-10,arc,1,Quyển 1,volume,1,Hồi 2,chapter,2,text,"Trương Dực Đức giận đánh Đốc bưu..."
```

---

## 4. Các lưu ý quan trọng khi tải file lên

1. **Dòng đầu tiên**: Phải là dòng tiêu đề (headers). Hệ thống tự động phân tích dòng 1 để xác định cấu trúc cột.
2. **Trùng tên truyện**: Nếu nhiều dòng trong file có cùng `title`, hệ thống chỉ tạo 1 bản ghi Story và gộp toàn bộ các node của các dòng đó vào Story này.
3. **Bảo toàn tính toàn vẹn khóa ngoại (Foreign Keys)**:
   - Nếu `nation_id` hoặc `nation` không tồn tại trong hệ thống: trường quốc gia của truyện sẽ được gán `null` (không gây lỗi gián đoạn).
   - Nếu `cover_art_id` hoặc `image_id` không tồn tại trong bảng `Image`: trường ảnh sẽ được gán `null` (không gây lỗi gián đoạn).
   - Nếu `genres` chứa tên thể loại không có trong DB: hệ thống sẽ tự động bỏ qua thể loại đó và gắn các thể loại hợp lệ còn lại.
   - Nếu `author_ids` chứa UUID không có trong DB: hệ thống sẽ tự động bỏ qua UUID đó và gắn các tác giả hợp lệ còn lại.
4. **Xử lý nền (Background Worker)**:
   - Khi gọi API upload file, server phản hồi ngay lập tức `HTTP 200: Đã tiếp nhận file và chuyển vào hàng đợi xử lý nền`.
   - BullMQ Worker sẽ thực hiện import từng dòng, cập nhật số lượng con (`number_of_children`), làm mới bộ nhớ đệm Redis và tự động kích hoạt tạo vector embedding cho truyện.

---

## 5. Batch Import Bằng File ZIP Kèm Hình Ảnh (Hỗ trợ file lớn hàng chục GB)

### 5.1 Tổng quan kiến trúc & Luồng xử lý

Đối với việc import khối lượng lớn truyện tranh kèm ảnh bìa và ảnh các trang truyện, hệ thống hỗ trợ đóng gói toàn bộ vào một file `.zip`.

1. **Không giới hạn RAM (Stream to Disk)**:
   - File zip có thể nặng từ vài trăm MB đến hàng chục GB.
   - Quá trình upload/download tuyệt đối không đưa vào bộ nhớ RAM mà stream trực tiếp xuống ổ đĩa tại thư mục tạm `TEMP_DIR/uploads/<sessionId>.zip`.
2. **Bảo vệ ổ đĩa (Disk Space Guard & ENOSPC)**:
   - Hệ thống tự động kiểm tra dung lượng còn trống trên ổ đĩa (`MIN_DISK_FREE_SPACE_MB`, mặc định 1024MB).
   - Nếu trong quá trình tải xuống/tải lên mà ổ đĩa bị đầy hoặc dung lượng trống thấp hơn ngưỡng an toàn, hệ thống sẽ **ngay lập tức hủy kết nối stream, xóa file zip đang tải dở** và trả về mã lỗi `HTTP 507/413: Dung lượng đĩa không đủ hoặc file quá lớn`.
3. **Giải nén & Xử lý nền (Worker)**:
   - Sau khi file zip về ổ đĩa an toàn, API trả về ngay `sessionId` cho client và đẩy job vào hàng đợi `batch-import-zip`.
   - Worker giải nén file zip vào thư mục `TEMP_DIR/processing/<sessionId>` (sử dụng tiện ích hệ thống `7z` siêu tốc hoặc `unzip`).
   - Tên file zip và file CSV là gì không quan trọng: Worker tự động quét và nhận diện file bảng tính CSV/XLSX nằm trong archive.
   - Worker đọc từng dòng dữ liệu, lấy ảnh từ đường dẫn tương đối (tính từ vị trí file CSV), sao chép vào `PUBLIC_DIR/images/stories`, chèn vào bảng `Image` với `provider = "local"`, và gắn `cover_art_id` / `image_id` cho các trang truyện.
4. **Dọn dẹp thư mục sau khi hoàn thành**:
   - Thư mục giải nén `processing/<sessionId>` luôn được xóa sạch sau khi xử lý xong để giải phóng dung lượng đĩa.
   - File gốc `.zip` được xử lý dựa trên cấu hình `CLEANUP_ZIP_AFTER_PROCESSING` (hoặc tham số request `cleanupAfterProcessing`):
     - Nếu `true`: Xóa hoàn toàn file zip.
     - Nếu `false`: Chuyển file zip sang thư mục lưu trữ `TEMP_DIR/completed/<sessionId>/`.

---

### 5.2 Cấu trúc file ZIP mẫu

File nén `.zip` có thể chứa cấu trúc phẳng hoặc phân tầng. Đường dẫn ảnh luôn được tính **tương đối từ vị trí của file CSV**:

```
manga_batch.zip
├── stories.csv
├── covers/
│   ├── naruto.jpg
│   └── onepiece.png
└── chapters/
    ├── naruto_chap1/
    │   ├── 01.jpg
    │   └── 02.jpg
    └── naruto_chap2/
        ├── 01.jpg
        └── 02.jpg
```

Hoặc nếu toàn bộ nội dung nằm trong một thư mục con bên trong file ZIP:

```
manga_batch.zip
└── export_data/
    ├── stories.csv
    ├── covers/
    │   └── naruto.jpg
    └── pages/
        ├── c1_01.jpg
        └── c1_02.jpg
```

_(Trong trường hợp này, file CSV ở `export_data/stories.csv`, các đường dẫn `covers/naruto.jpg` hoặc `pages/c1_01.jpg` được tính tương đối từ `export_data/`)._

---

### 5.3 Mẫu CSV dùng trong File ZIP

```csv
title,story_type,story_status,nation,genres,summary,cover_art_path,story_node_title,story_node_type,story_node_order_index,story_node_content_order_index,story_node_content_image_path
Naruto,manga,finished,Japan,"Action,Ninja","Hành trình trở thành Hokage của Naruto Uzumaki",covers/naruto.jpg,Chương 1,chapter,1,1,chapters/naruto_chap1/01.jpg
Naruto,manga,finished,Japan,"Action,Ninja","Hành trình trở thành Hokage của Naruto Uzumaki",covers/naruto.jpg,Chương 1,chapter,1,2,chapters/naruto_chap1/02.jpg
Naruto,manga,finished,Japan,"Action,Ninja","Hành trình trở thành Hokage của Naruto Uzumaki",covers/naruto.jpg,Chương 2,chapter,2,1,chapters/naruto_chap2/01.jpg
Naruto,manga,finished,Japan,"Action,Ninja","Hành trình trở thành Hokage của Naruto Uzumaki",covers/naruto.jpg,Chương 2,chapter,2,2,chapters/naruto_chap2/02.jpg
```

---

### 5.4 Chi tiết các API Zip Batch Import

#### 1. Upload File ZIP từ Client

- **Endpoint**: `POST /admin/stories/upload-zip` (hoặc `POST /admin/stories` với file zip)
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: File `.zip` (bắt buộc).
  - `cleanupAfterProcessing`: `true` hoặc `false` (tùy chọn, ghi đè biến môi trường).
- **Phản hồi mẫu**:
  ```json
  {
    "status": "success",
    "message": "Đã tiếp nhận file ZIP và chuyển vào hàng đợi xử lý nền",
    "data": {
      "sessionId": "4bb44158-b631-414d-91b7-9e455e967a57",
      "fileName": "manga_batch.zip",
      "size": 104857600
    }
  }
  ```

#### 2. Download File ZIP từ URL từ xa

- **Endpoint**: `POST /admin/stories/download-zip`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "url": "https://storage.googleapis.com/my-bucket/manga_batch_50gb.zip",
    "cleanupAfterProcessing": false
  }
  ```
- **Phản hồi mẫu**:
  ```json
  {
    "status": "success",
    "message": "Đã tải file ZIP về máy chủ và chuyển vào hàng đợi xử lý nền",
    "data": {
      "sessionId": "4bb44158-b631-414d-91b7-9e455e967a57",
      "fileName": "manga_batch_50gb.zip",
      "size": 53687091200
    }
  }
  ```

---

### 5.5 Cấu hình Biến Môi Trường (.env)

| Tên biến                       | Giá trị mặc định           | Mô tả                                                                                                         |
| :----------------------------- | :------------------------- | :------------------------------------------------------------------------------------------------------------ |
| `TEMP_DIR`                     | `<root>/server/temp`       | Đường dẫn thư mục lưu trữ file tạm (chứa các thư mục `uploads`, `processing`, `completed`).                   |
| `PUBLIC_DIR`                   | `<root>/server/src/public` | Thư mục static public (hình ảnh được sao chép vào `PUBLIC_DIR/images/stories`).                               |
| `CLEANUP_ZIP_AFTER_PROCESSING` | `true`                     | Có tự động xóa file zip sau khi worker xử lý xong không (`true` là xóa, `false` là chuyển sang `completed`).  |
| `MIN_DISK_FREE_SPACE_MB`       | `1024`                     | Dung lượng trống tối thiểu cần giữ lại trên ổ đĩa tính theo MB. Nếu thấp hơn mức này quá trình tải sẽ bị hủy. |
