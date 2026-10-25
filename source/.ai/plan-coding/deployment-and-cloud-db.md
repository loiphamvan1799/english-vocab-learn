# Hướng dẫn Triển khai Web & Chuyển đổi Cloud SQLite (Miễn phí 100%)

Tài liệu này hướng dẫn chi tiết cách đưa toàn bộ hệ thống lên website hoàn toàn miễn phí, giải quyết triệt để vấn đề mất dữ liệu (ephemeral disk) trên Render, và thiết kế môi trường Local linh hoạt (vừa chạy offline vừa đồng bộ cloud).

---

## 1. Phân tích Kiến trúc: Local vs Production

### Vấn đề của hệ thống hiện tại
- **Backend Render (Free tier):** Không có Persistent Disk (ổ đĩa lưu trữ vĩnh viễn). Khi server ngủ (sau 15 phút không có request) hoặc khi restart/redeploy, các file sinh ra lúc chạy (`data/vocabulary.db` và `uploads/`) sẽ bị **xoá sạch** và reset về mã nguồn Git ban đầu.
- **Frontend Vercel (Free tier):** Máy chủ Serverless CDN toàn cầu, chạy Next.js siêu tốc, nhưng gọi API sang Render thì cần HTTPS và cấu hình CORS chặt chẽ.

### Giải pháp tối ưu: Hybrid Architecture (100% Free)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          LOCAL DEVELOPMENT                             │
│  source/client (localhost:3000) ──> source/server (localhost:4000)     │
│                                              │                         │
│                           DATABASE_URL = file:data/vocabulary.db       │
│                                              ▼                         │
│                                   [SQLite file cục bộ]                 │
│                                (Offline, tốc độ tức thì)               │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION (INTERNET)                           │
│   Vercel (Next.js CDN)  ───────────>  Render (Express API)             │
│   https://app.vercel.app               https://api.onrender.com        │
│                                              │                         │
│                    DATABASE_URL = libsql://your-db.turso.io            │
│                    DATABASE_AUTH_TOKEN = eyJhbGci...                   │
│                                              ▼                         │
│                                   [Turso Cloud SQLite]                 │
│                         (9GB miễn phí, không bao giờ mất data)         │
└────────────────────────────────────────────────────────────────────────┘
```

| Thành phần | Môi trường Local | Môi trường Production | Chi phí |
|---|---|---|---|
| **Frontend** | `localhost:3000` | **Vercel** (`https://*.vercel.app`) | Miễn phí |
| **Backend** | `localhost:4000` | **Render Web Service** (`https://*.onrender.com`) | Miễn phí |
| **Database** | File `data/vocabulary.db` (Offline) | **Turso libSQL** (`libsql://...`) | Miễn phí (9GB, 500 DBs) |
| **Media / Ảnh**| Thư mục `source/server/uploads` | **Cloudinary** / Supabase Storage / External CDN | Miễn phí |
| **Keep-alive** | Không cần | **UptimeRobot** / Cron-job.org ping `/api/health` | Miễn phí |

---

## 2. Thiết kế Local: Làm sao để vừa code Local vừa dùng Cloud?

Khi chuyển sang sử dụng Turso (libSQL - phiên bản mở rộng của SQLite):
- Thư viện client `@libsql/client` hỗ trợ cả 2 giao thức:
  1. `file:data/vocabulary.db`: Đọc ghi trực tiếp file SQLite trên máy bạn, **không cần mạng internet**, tốc độ 0ms.
  2. `libsql://your-db.turso.io`: Kết nối trực tiếp cơ sở dữ liệu trên cloud qua HTTP/WebSocket.
- **Cơ chế Switchable (Chuyển đổi thông minh):**
  Trong code backend `connection.ts`, hệ thống sẽ kiểm tra biến môi trường:
  - Nếu `DATABASE_URL` bắt đầu bằng `libsql://` hoặc `https://`: Kết nối Turso cloud.
  - Nếu không có hoặc có dạng `file:...`: Tự động đọc ghi file SQLite tại `data/vocabulary.db`.

Như vậy, khi lập trình ở máy tính, bạn **vẫn giữ nguyên thói quen làm việc cũ**, không sợ bị mất tính năng offline hay phụ thuộc mạng.

---

## 3. Step-by-Step: Thiết lập Cơ sở dữ liệu Turso (Miễn phí 9GB)

### Bước 3.1: Đăng ký tài khoản Turso
1. Truy cập [https://turso.tech](https://turso.tech) và nhấn **Sign Up** (đăng nhập bằng GitHub).
2. Turso cung cấp gói **Hobby vĩnh viễn:** 9GB lưu trữ, 500 databases, 1 tỷ lượt đọc mỗi tháng.

### Bước 3.2: Tạo Database trên Turso Dashboard
1. Sau khi đăng nhập, tại mục Databases bấm **Create Database**.
2. Đặt tên database: `english-vocab-db`.
3. Chọn khu vực (Location): Chọn **Tokyo (nrt)** hoặc **Singapore (sin)** để có độ trễ kết nối thấp nhất từ Việt Nam.
4. Bấm **Create Database**.

### Bước 3.3: Lấy Database URL và Auth Token
1. Tại trang chi tiết database `english-vocab-db`, bạn sẽ thấy:
   - **Database URL:** dạng `libsql://english-vocab-db-<username>.turso.io`
2. Nhấn vào nút **Generate Token** (hoặc tab **Tokens**):
   - Đặt expiration: vĩnh viễn (hoặc không hết hạn)
   - Sao chép chuỗi token dài (Token này dùng để xác thực quyền truy cập).

> [!TIP]
> Lưu lại 2 thông tin này:
> - `TURSO_DATABASE_URL=libsql://english-vocab-db-<username>.turso.io`
> - `TURSO_AUTH_TOKEN=eyJhbGciOi...`

---

## 4. Chuyển đổi Code Backend để hỗ trợ Turso & Local

### Bước 4.1: Cài đặt thư viện `@libsql/client` trong `source/server`
```bash
npm --prefix source/server install @libsql/client
```

### Bước 4.2: Cấu hình `source/server/src/db/connection.ts`
Chuyển đổi adapter kết nối để nhận diện môi trường:

```typescript
import { createClient } from '@libsql/client';
import path from 'node:path';
import fs from 'node:fs';

const isProduction = process.env.NODE_ENV === 'production';
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

const dataDir = path.resolve(process.cwd(), 'data');
const localDbPath = path.join(dataDir, 'vocabulary.db');

if (!tursoUrl) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const dbClient = createClient({
  url: tursoUrl || `file:${localDbPath}`,
  authToken: tursoToken,
});
```

### Bước 4.3: Đồng bộ Schema (Migrations) lên Turso
Khi backend khởi động lần đầu trên Render với biến môi trường của Turso, hàm `runMigrations()` trong `source/server/src/db/migrate.ts` sẽ tự động khởi tạo toàn bộ bảng (`topics`, `words`, `user_profile`, `collections`, `study_log`, `quizzes`) trên Turso mà không cần chạy SQL thủ công.

---

## 5. Giải pháp cho File Uploads (Media / Hình ảnh)

Do Render Free không giữ file trong thư mục `uploads/`:
- **Trường hợp 1 (Link ngoài - Đang dùng):** Khi import từ vựng (ví dụ file `fruits.html`), các ảnh dùng link Unsplash (`https://images.unsplash.com/...`). Link này nằm trực tiếp trên Internet nên **không bao giờ bị mất** khi Render restart.
- **Trường hợp 2 (Upload ảnh từ máy tính):** Nếu người dùng chọn file ảnh từ máy khi import:
  - Giải pháp 1: Đăng ký tài khoản miễn phí tại **Cloudinary** (25GB) và thêm SDK `cloudinary` để upload ảnh lên Cloud thay vì lưu đĩa cục bộ.
  - Giải pháp 2: Sử dụng **Supabase Storage** (1GB miễn phí bucket S3-compatible).

---

## 6. Step-by-Step: Triển khai Backend lên Render (Express API)

### Bước 6.1: Tạo Web Service
1. Đăng nhập [render.com](https://render.com) bằng GitHub.
2. Chọn **New +** ➔ **Web Service**.
3. Chọn Git repository của dự án.
4. Cấu hình các mục:
   - **Name:** `english-vocab-api`
   - **Region:** `Singapore`
   - **Branch:** `main`
   - **Root Directory:** `source/server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Instance Type:** `Free`

### Bước 6.2: Thêm biến môi trường (Environment Variables) trên Render
Thêm các key-value sau trong phần **Environment**:
```env
NODE_ENV=production
NODE_VERSION=20.18.0
PORT=10000
TURSO_DATABASE_URL=libsql://english-vocab-db-<username>.turso.io
TURSO_AUTH_TOKEN=<chuoi_token_turso_cua_ban>
ALLOWED_ORIGINS=https://localhost:3000,https://<ten-frontend-cua-ban>.vercel.app
```
*(Nếu chưa có link Vercel, tạm thời điền `*` cho `ALLOWED_ORIGINS`, sau khi có link Vercel sẽ cập nhật lại).*

5. Nhấn **Deploy Web Service**.
6. Lưu lại link backend do Render cấp: ví dụ `https://english-vocab-api.onrender.com`.

---

## 7. Step-by-Step: Triển khai Frontend lên Vercel (Next.js)

### Bước 7.1: Import Project
1. Đăng nhập [vercel.com](https://vercel.com) bằng GitHub.
2. Nhấn **Add New...** ➔ **Project**.
3. Chọn repository của bạn ➔ bấm **Import**.

### Bước 7.2: Cấu hình Build & Environment
1. **Framework Preset:** `Next.js`.
2. **Root Directory:** Bấm nút **Edit** và chọn `source/client`.
3. Mở mục **Environment Variables** và điền:
   - **Name:** `NEXT_PUBLIC_API_BASE_URL`
   - **Value:** `https://english-vocab-api.onrender.com` *(Lưu ý: KHÔNG có dấu gạch chéo `/` ở cuối)*
4. Nhấn **Deploy**.
5. Vercel sẽ build và cung cấp link website: `https://<ten-du-an>.vercel.app`.

---

## 8. Hoàn tất & Cấu hình Giữ Server luôn hoạt động (Keep-Alive)

### Bước 8.1: Khớp CORS giữa Vercel và Render
1. Quay lại trang quản trị Render của Backend ➔ vào tab **Environment**.
2. Cập nhật biến `ALLOWED_ORIGINS` chính xác với domain Vercel nhận được:
   ```env
   ALLOWED_ORIGINS=https://<ten-du-an>.vercel.app,http://localhost:3000
   ```
3. Bấm **Save Changes** để Render tự cập nhật.

### Bước 8.2: Chống "ngủ" cho Render Free (Hoàn toàn miễn phí)
Render Free sẽ tự ngủ nếu không có lượt truy cập sau 15 phút:
1. Đăng ký tài khoản miễn phí tại [cron-job.org](https://cron-job.org/) hoặc [uptimerobot.com](https://uptimerobot.com/).
2. Tạo 1 HTTP monitor:
   - **URL:** `https://english-vocab-api.onrender.com/api/health`
   - **Interval:** Mỗi `10 phút` (10 minutes).
3. Monitor này sẽ tự động ping mỗi 10 phút, giúp Render luôn giữ server online 24/7, người dùng mở web không phải chờ 50 giây cold start.

---

## 9. Bảng Checklist Nghiệm thu

- [ ] Database Turso đã được tạo và có URL + Token.
- [ ] Backend local chạy được cả với file `vocabulary.db` lẫn Turso khi điền biến môi trường.
- [ ] Backend Render deploy thành công, truy cập `/api/health` trả về status `ok`.
- [ ] Frontend Vercel deploy thành công, mở trang chủ hiển thị giao diện Tiếng Việt chuẩn thiết kế.
- [ ] Tạo thử chủ đề / học thử từ vựng trên Vercel: Dữ liệu được lưu trực tiếp vào Turso.
- [ ] Tắt và bật lại Render (Restart): Dữ liệu học tập và chủ đề vẫn còn nguyên vẹn 100%.
- [ ] Cron-job/UptimeRobot ping định kỳ thành công mỗi 10 phút.
