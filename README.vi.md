# Skillary

Kho lưu trữ, quản lý gói và trình xem mã nguồn AI agent skill mã nguồn mở.

[English](README.md) | Tiếng Việt

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-green.svg)](package.json)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black.svg)](package.json)
[![Tests](https://img.shields.io/badge/Tests-155%20passed-success.svg)](tests/)

Skillary là một ứng dụng web và kho gói kỹ năng đa người dùng (mặc định riêng tư), được thiết kế để xuất bản, tìm kiếm, kiểm tra, tải về và tạo nhánh (fork) các **AI Agent Skill** chuẩn hóa (`SKILL.md`).

---

## Tính năng nổi bật

- **Kho kỹ năng Web & CLI đồng nhất**: Khám phá các skill cộng đồng được chọn lọc hoặc cài đặt trực tiếp vào workspace của agent qua lệnh `npx skillary add @owner/slug`.
- **Kiến trúc bảo mật mặc định (Private-by-Default)**: Kiểm soát quyền hiển thị chi tiết (`PRIVATE`, `UNLISTED`, `PUBLIC`) cùng cơ chế chống IDOR nghiêm ngặt (trả về mã `404 Not Found` khi truy cập trái phép).
- **Khử trùng lặp nội dung (Content-Addressed Deduplication)**: Tệp dữ liệu được khử trùng lặp qua mã băm SHA-256 (`blobs/<sha256>`). Khi fork một skill, hệ thống không tốn thêm dung lượng lưu trữ blob.
- **Quy trình nạp tệp (Ingest Pipeline) được thắt chặt**: Cơ chế stream ZIP chặn các cuộc tấn công Zip Slip (`../`), zip bombs, symlinks, tệp nhạy cảm (`.env`, `id_rsa`) và tệp thực thi.
- **Nhập từ GitHub chống tấn công SSRF**: Nhập trực tiếp kho mã nguồn với cơ chế kiểm tra whitelist tên miền, giới hạn số lần chuyển hướng và cách ly token truy cập cá nhân.
- **Tối ưu hóa giới hạn tài nguyên & Free-Tier**: Giới hạn tối đa 200 KB cho mỗi tệp, hạn ngạch lưu trữ 10 MB cho mỗi tài khoản và gói nén tối đa 5 MB.
- **Tìm kiếm toàn văn song ngữ (Full-Text Search)**: Tích hợp vector FTS trong PostgreSQL hỗ trợ loại bỏ dấu tiếng Việt (`unaccent`) và tìm kiếm mờ với `pg_trgm`.
- **Trình soạn thảo trực quan trên trình duyệt**: Duyệt cây tệp dạng split-screen, chỉnh sửa mã nguồn với CodeMirror và xem trước Markdown đã được làm sạch an toàn.

---

## Hướng dẫn nhanh

### Yêu cầu hệ thống

- **Node.js**: v20+ (khuyến nghị v24 LTS)
- **PostgreSQL**: 15+ đã kích hoạt tiện ích mở rộng `unaccent` và `pg_trgm`
- **Docker** (tùy chọn): để triển khai dạng container

### 1. Clone & Cài đặt thư viện

```bash
git clone https://github.com/HarryLeon/Skillary.git
cd Skillary
npm install
```

### 2. Thiết lập biến môi trường

Sao chép `.env.example` thành `.env`:

```bash
cp .env.example .env
```

Cấu hình chuỗi kết nối cơ sở dữ liệu và khóa bí mật phiên (tối thiểu 32 ký tự):

```env
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/skillary?schema=public
BETTER_AUTH_SECRET=skillary_super_secret_session_key_32_characters_minimum
STORAGE_DRIVER=local
STORAGE_LOCAL_DIR=./storage/blobs
```

### 3. Đồng bộ Database & Dữ liệu mẫu

```bash
npx prisma migrate dev
npm run db:seed
```

### 4. Khởi chạy máy chủ phát triển

```bash
npm run dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

---

## Cài đặt gói qua CLI

Mọi skill ở trạng thái công khai (public) hoặc unlisted có token chia sẻ đều có thể được cài đặt vào dự án AI agent qua NPX:

```bash
npx skillary add @owner/skill-name
```

Cài đặt skill unlisted bằng token chia sẻ bí mật:

```bash
npx skillary add @owner/skill-name --token <share-token>
```

---

## Giới hạn lưu trữ & Nạp tệp (Free-Tier)

Skillary được thiết lập tối ưu cho các gói lưu trữ máy chủ giới hạn tài nguyên và cloud free-tier:

| Hạng mục                            | Giới hạn                        | Nơi áp dụng                                    |
| :---------------------------------- | :------------------------------ | :--------------------------------------------- |
| **Dung lượng tối đa mỗi tệp**       | `200 KB`                        | Pipeline nạp tệp & Xác thực API                |
| **Dung lượng tối đa mỗi tài khoản** | `10 MB`                         | Giao dịch DAL (`createSkill`, `createVersion`) |
| **Dung lượng tối đa gói nén**       | `5 MB`                          | Form tải lên & Giải nén ZIP                    |
| **Tổng dung lượng sau giải nén**    | `15 MB`                         | Trình đọc Stream ZIP                           |
| **Số lượng tệp tối đa mỗi skill**   | `100`                           | Ingest Pipeline (`MAX_SKILL_FILES`)            |
| **Định dạng tải lên đơn lẻ hợp lệ** | `.zip`, `.skill`, `.md`, `.txt` | Route Handlers của API                         |

---

## Triển khai môi trường Production (Docker)

Skillary cung cấp cấu hình Docker tối ưu với user không có đặc quyền root (`nextjs:nodejs`):

```bash
docker compose up --build -d
```

Các dịch vụ bao gồm:

- `skillary-app`: Máy chủ Next.js production tích hợp kiểm tra sức khỏe tự động (`/api/health`)
- `skillary-db`: PostgreSQL hỗ trợ `unaccent` và `pg_trgm`
- `skillary-minio`: Hệ thống lưu trữ đối tượng blob chuẩn S3

Chạy migration cơ sở dữ liệu trên production:

```bash
npx prisma migrate deploy
```

---

## Danh mục biến môi trường

| Biến                      |  Bắt buộc   |        Mặc định         | Mục đích                                                    |
| :------------------------ | :---------: | :---------------------: | :---------------------------------------------------------- |
| `NODE_ENV`                |     Có      |      `development`      | Môi trường chạy (`development`, `production`, `test`)       |
| `APP_URL`                 |     Có      | `http://localhost:3000` | URL gốc phục vụ CSRF và tạo liên kết                        |
| `DATABASE_URL`            |     Có      |            -            | Chuỗi kết nối PostgreSQL                                    |
| `BETTER_AUTH_SECRET`      |     Có      |            -            | Khóa mã hóa session (tối thiểu 32 ký tự)                    |
| `STORAGE_DRIVER`          |     Có      |         `local`         | `local` lưu trữ tại ổ đĩa hoặc `s3` cho MinIO / AWS S3 / R2 |
| `MAX_FILE_BYTES`          |    Không    |    `204800` (200 KB)    | Dung lượng tối đa mỗi tệp khi nạp                           |
| `MAX_ACCOUNT_TOTAL_BYTES` |    Không    |   `10485760` (10 MB)    | Hạn ngạch dung lượng lưu trữ trên mỗi tài khoản             |
| `S3_BUCKET`               | Nếu dùng s3 |            -            | Tên bucket lưu trữ blob                                     |
| `GITHUB_TOKEN`            |    Không    |            -            | Token GitHub cá nhân để tăng giới hạn API rate limit        |
| `LOG_LEVEL`               |    Không    |         `info`          | Mức độ ghi log (`debug`, `info`, `warn`, `error`)           |

---

## Kiểm thử & Chất lượng mã nguồn

```bash
# Chạy bộ kiểm thử đơn vị và tích hợp (155 tests)
npm test

# Chạy kiểm thử End-to-End trên trình duyệt
npm run test:e2e

# Kiểm tra cú pháp (linter)
npm run lint

# Kiểm tra định dạng code
npm run format:check
```

---

## Kiến trúc an toàn & Bảo mật

- **Không thực thi mã nguồn tùy ý**: Kỹ năng (skill) chỉ đóng vai trò là tệp hướng dẫn, tài liệu và prompt mẫu. Skillary tuyệt đối không thực thi mã tải lên từ người dùng trên máy chủ.
- **Khử khuẩn nhiều lớp (Sanitization)**: Markdown được render qua `react-markdown` kết hợp `rehype-sanitize`. Các thẻ nguy hiểm như `<script>`, `<iframe>` và `<object>` đều bị loại bỏ triệt để.
- **Tiêu đề tải xuống nghiêm ngặt**: Điểm cuối tải tệp thô áp dụng `X-Content-Type-Options: nosniff`, `Content-Security-Policy: sandbox`, và ép buộc `Content-Disposition: attachment` đối với các tệp thực thi hoặc kiểu mime không rõ ràng.
- **Phòng chống CSRF & Xác thực Origin**: Các yêu cầu thay đổi dữ liệu (`POST`, `PATCH`, `DELETE`) từ origin lạ đều bị từ chối.

---

## Bản quyền & Giấy phép

Phát hành theo [Giấy phép MIT](LICENSE).  
Bản quyền thuộc về &copy; 2026 HarryLeon.
