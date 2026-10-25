# Phase 02 — Database + REST API cơ bản

## P02-T01 — SQLite connection và schema

**Mục tiêu:** Tạo file SQLite local, bật foreign keys và schema versioned cho topic/word/media/progress/collection/quiz/profile.

**File cần tạo/sửa:** `source/server/src/db/connection.ts`, `source/server/src/db/migrate.ts`, `source/server/src/shared/constants.ts`.

**Spec liên quan:** `data-and-api.md` (bảng 1–2); `coding-rules.md` (SQL parameterized); F-05, F-06, F-08, F-10, F-11.

**Các bước làm:**
1. Tạo connection một lần, đường dẫn DB lấy từ env, tạo parent directory runtime.
2. Bật `foreign_keys`, timeout phù hợp và migration version.
3. Tạo tables/indexes/constraints khớp data spec, không thêm trường giả vào nguồn.
4. Seed profile local và collection “Yêu thích” idempotently.
5. Viết constants cho status/limits dùng chung phía server.

**Tiêu chí hoàn thành:**
- [ ] DB tạo được lần đầu và migrate nhiều lần không duplicate seed.
- [ ] FK cascade/set-null và unique constraints hoạt động.
- [ ] Tên/kiểu/cột khớp spec.
- [ ] Không có dữ liệu mẫu ngoài seed tối thiểu.

**Phụ thuộc:** P01-T01, P01-T04.

## P02-T02 — Repository topic và word

**Mục tiêu:** Cô lập truy vấn topic/word từ routes, hỗ trợ list/detail/search và upsert order an toàn.

**File cần tạo/sửa:** `source/server/src/db/repositories/topics.ts`, `source/server/src/db/repositories/words.ts`, `source/server/src/shared/types.ts`.

**Spec liên quan:** `data-and-api.md` (topics/words); F-01, F-02, F-03.

**Các bước làm:**
1. Tạo repository typed cho lấy topic list/detail và word list `ORDER BY position`.
2. Tạo query search giới hạn result và dùng parameter binding.
3. Thêm transaction helper/upsert primitives chỉ khi phục vụ task tiếp theo.
4. Map DB row về response domain; không lộ SQLite-specific errors.

**Tiêu chí hoàn thành:**
- [ ] Query chỉ dùng prepared/parameterized statements.
- [ ] Order/word count đúng; topic không có word trả empty array.
- [ ] TypeScript strict pass.
- [ ] Không đặt SQL trong route.

**Phụ thuộc:** P02-T01.

## P02-T03 — API nền và uploads static

**Mục tiêu:** Cung cấp response/error convention và endpoint topic/word read cùng static media route.

**File cần tạo/sửa:** `source/server/src/middleware/error-handler.ts`, `source/server/src/routes/topics.ts`, `source/server/src/routes/words.ts`, `source/server/src/shared/api-response.ts`, `source/server/src/index.ts`.

**Spec liên quan:** `data-and-api.md` (REST envelope/topic/search, uploads); F-01, F-02, F-03, F-12.

**Các bước làm:**
1. Khai báo helper success/error envelope và centralized error handler.
2. Khai báo GET `/api/topics`, `/api/topics/:topicId`, `/api/words/search` với Zod validation.
3. Trả 404 đúng chuẩn và không trả stack trace.
4. Mount routes, `/uploads` static an toàn, `X-Content-Type-Options: nosniff`, không directory listing.
5. Smoke-test endpoint và response shape.

**Tiêu chí hoàn thành:**
- [ ] JSON envelope đồng nhất trên thành công/lỗi.
- [ ] Endpoint trả đúng status code, order và validation.
- [ ] `/uploads` chỉ phục vụ từ uploads root.
- [ ] CORS/health server vẫn hoạt động.

**Phụ thuộc:** P02-T01, P02-T02, P01-T04.
