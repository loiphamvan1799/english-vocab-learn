# Phase 04 — Import chủ đề HTML

> Trước mọi task trong phase này, mở và đọc toàn bộ `source/.ai/content/template/fruits.html`. Không dùng `style.css` làm schema; đối chiếu `html-import.md`.

## P04-T01 — Parse topic literal an toàn

**Mục tiêu:** Parse metadata/description bằng cheerio và literal `TOPIC_METADATA`/`VOCAB_DATA` bằng AST, tuyệt đối không execute script.

**File cần tạo/sửa:** `source/server/src/import/topic-parser.ts`, `source/server/src/import/schemas.ts`, `source/server/package.json`.

**Spec liên quan:** F-07; `html-import.md` (sections 1–4, mappings/errors); `data-and-api.md` (topics/words).

**Các bước làm:**
1. Đọc toàn bộ `source/.ai/content/template/fruits.html`; ghi nhận meta và 30 object fields.
2. Dùng cheerio lấy meta/title/description; dùng Acorn parse inline JS syntax.
3. Trích literal declarations duy nhất; reject call/spread/identifier/duplicate keys/depth quá lớn; không dùng eval.
4. Zod validate toàn bộ topic/word data, required fields, IDs unique, declared count mismatch thành warning.
5. Giữ nguyên order và nội dung, chỉ trim biên; trả parsed object + warning.

**Tiêu chí hoàn thành:**
- [ ] Template thật parse thành topic id `fruits-vn`, title đúng, 30 words.
- [ ] Mango fields khớp HTML nguồn gồm image URL, IPA, examples.
- [ ] Script không được thực thi; malformed/non-literal rejected.
- [ ] TypeScript strict pass.

**Phụ thuộc:** P02-T01, P01-T01.

## P04-T02 — Resolve media và staging

**Mục tiêu:** Nhận media companion, resolve relative/URL/data URI an toàn và quản lý staging/cleanup.

**File cần tạo/sửa:** `source/server/src/import/media-resolver.ts`, `source/server/src/middleware/upload.ts`, `source/server/src/config/env.ts`.

**Spec liên quan:** F-07; `html-import.md` (media/error/transaction); `data-and-api.md` (upload/static/storage).

**Các bước làm:**
1. Đọc template `fruits.html` và ghi nhận ảnh thật là URL Unsplash; không có audio/media companion.
2. Áp dụng byte/count/MIME allowlists và generated names; relative resolve chỉ trong upload package.
3. Validate SSRF, redirects, timeout/byte limits cho external URLs; reject local/private network.
4. Decode data URI allowlisted MIME/size/magic; không tin filename.
5. Tạo staging lifecycle cleanup/expiry, giữ URL external khi fetch fail và phát warning.

**Tiêu chí hoàn thành:**
- [ ] Path traversal/private IP/unsupported MIME bị chặn.
- [ ] Download/media lỗi có warning, không làm thay đổi nguồn text.
- [ ] Không để file vĩnh viễn khi preview bị cancel/expire.
- [ ] Tests hoặc unit validation cho đường dẫn/media policy pass.

**Phụ thuộc:** P01-T04, P02-T01.

## P04-T03 — Topic import service

**Mục tiêu:** Orchestrate preview/confirm, duplicate strategies và atomic DB/media writes.

**File cần tạo/sửa:** `source/server/src/services/topic-import-service.ts`, `source/server/src/db/repositories/topics.ts`, `source/server/src/db/repositories/words.ts`, `source/server/src/db/repositories/media-assets.ts`.

**Spec liên quan:** F-07; `html-import.md` (duplicate/fidelity/transaction); `data-and-api.md` (schema/import lifecycle).

**Các bước làm:**
1. Đọc template `fruits.html`; kiểm chứng topic ID và `source_id` mapping.
2. Tạo preview record opaque, short-lived, giữ parsed payload/media staging phía server.
3. Confirm nhận `overwrite/create-copy/cancel`; validate lại expiry/conflict trước khi ghi.
4. Ghi media + topic + words trong transaction, giữ progress với source ID trùng khi overwrite.
5. Khi lỗi rollback và xóa file mới; khi success publish media rồi dọn staging.

**Tiêu chí hoàn thành:**
- [ ] Preview không sửa DB.
- [ ] Overwrite/create-copy/cancel đúng hành vi và ID.
- [ ] Error injection giữa transaction không lưu dở hoặc để file rác.
- [ ] Topic mới giữ đúng row count/order/media refs.

**Phụ thuộc:** P04-T01, P04-T02, P02-T01, P02-T02.

## P04-T04 — Topic import API

**Mục tiêu:** Expose multipart preview và confirm REST endpoints với Zod, envelope và mã lỗi chuẩn.

**File cần tạo/sửa:** `source/server/src/routes/imports.ts`, `source/server/src/index.ts`, `source/server/src/shared/api-response.ts`.

**Spec liên quan:** F-07; `data-and-api.md` (import endpoints); `html-import.md` (error mapping).

**Các bước làm:**
1. Đọc template `fruits.html` và xác nhận request fields/preview display contract.
2. Mount multer middleware cho `html` và `assets[]`; reject extension/size/type sai.
3. Gọi import service; route không parse HTML và không chứa SQL.
4. Map `HTML_PARSE_FAILED`, `FIELD_MISSING`, duplicate conflict, 413 và expired preview thành HTTP/envelope.
5. Smoke-test preview/confirm/cancel và request malformed.

**Tiêu chí hoàn thành:**
- [ ] Route chỉ orchestration/validation, parser tách riêng.
- [ ] `POST /api/imports/topics/preview` trả previewId, items, warnings.
- [ ] Confirm idempotent-safe, conflict không bị ghi đè vô tình.
- [ ] Không lộ stack/source HTML thô trong response.

**Phụ thuộc:** P04-T03, P02-T03.

## P04-T05 — Trang import topic

**Mục tiêu:** Xây dựng flow 3 bước chọn file, preview và hoàn tất với duplicate choice/warnings thân thiện.

**File cần tạo/sửa:** `source/client/app/topics/new/page.tsx`, `source/client/components/import/import-dropzone.tsx`, `source/client/components/import/import-stepper.tsx`, `source/client/components/import/import-preview.tsx`, `source/client/features/topics/topics-api.ts`.

**Spec liên quan:** F-07; `ui-design.md` (Import topic); `data-and-api.md` (upload endpoints).

**Các bước làm:**
1. Đọc template `fruits.html` để bảo đảm preview hiển thị đúng fields/30 items, không render HTML.
2. Tạo drop/select HTML và companion media; client-side extension/size feedback không thay server validation.
3. Gọi preview và render metadata/count/list rút gọn/warnings/errors.
4. Xử lý duplicate options overwrite/create-copy/cancel; confirm success điều hướng topic.
5. Thêm loading/error/cancel/retry và accessibility keyboard/focus.

**Tiêu chí hoàn thành:**
- [ ] 3-stepper chọn/xem trước/hoàn tất hoạt động.
- [ ] Preview không hiển thị HTML raw; lỗi/warning tiếng Việt.
- [ ] Confirm chỉ enabled khi preview valid.
- [ ] Success toast/message và redirect đúng topic.

**Phụ thuộc:** P03-T01, P03-T03, P04-T04.

## P04-T06 — Parser test topic fixture

**Mục tiêu:** Khóa schema/fidelity bằng test `node:test` trên template HTML thật.

**File cần tạo/sửa:** `source/server/src/tests/import/topic-parser.test.ts`, `source/server/package.json`.

**Spec liên quan:** F-07; `html-import.md` (example/fidelity checklist); `features.md` F-07.

**Các bước làm:**
1. Mở lại toàn bộ `source/.ai/content/template/fruits.html`; dùng file trực tiếp làm fixture, không tạo sample JSON.
2. Test metadata, đúng 30 items, thứ tự Mango/Banana và exact fields.
3. Test missing metadata/array, duplicate ID, unsupported executable AST form và count mismatch.
4. Gắn `node --test` vào script server, chạy test.

**Tiêu chí hoàn thành:**
- [ ] Fixture path chính là template thật.
- [ ] Assertion không chỉ count mà kiểm tra fidelity field/order.
- [ ] Parser test pass và không tạo fixture file thừa.

**Phụ thuộc:** P04-T01.

## P04-T07 — Xóa chủ đề có xác nhận

**Mục tiêu:** Cho phép xóa chủ đề từ trang học, với xác nhận rõ ràng và dọn dữ liệu/media liên quan an toàn.

**File cần tạo/sửa:** `source/server/src/services/topics-service.ts`, `source/server/src/routes/topics.ts`, `source/server/src/db/repositories/topics.ts`, `source/client/app/topics/[topicId]/page.tsx`, `source/client/components/topics/delete-topic-button.tsx`.

**Spec liên quan:** F-07; `data-and-api.md` (DELETE `/api/topics/:topicId`, cascade/attempt behavior); `features.md` F-07.

**Các bước làm:**
1. Xóa topic trong transaction để FK cascade progress, study logs và collection-word links; quiz topic relation set null, attempt snapshot giữ lại.
2. Dọn media assets chỉ khi không còn bản ghi nào tham chiếu; lỗi cleanup file được log và không làm DB đã commit sai trạng thái.
3. Expose DELETE route qua centralized error handler và status `204`/`404`.
4. Thêm nút xóa trong topic page, dialog nêu rõ dữ liệu bị ảnh hưởng và yêu cầu xác nhận.
5. Sau xóa điều hướng về trang chủ/topic list và refresh summary.

**Tiêu chí hoàn thành:**
- [ ] Không thể xóa do click nhầm; dialog có hủy mặc định.
- [ ] Topic/progress/words bị xóa, quiz attempts còn snapshot.
- [ ] Media không dùng nơi khác được cleanup; file dùng chung không bị xóa.
- [ ] Xóa topic không tồn tại trả `404`; success trả `204`.

**Phụ thuộc:** P02-T01–P02-T03, P04-T03.
