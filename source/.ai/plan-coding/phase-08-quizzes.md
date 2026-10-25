# Phase 08 — Import quiz, làm bài và kết quả

> Trước mọi task import trong phase này, mở và đọc toàn bộ `source/.ai/quiz/template/fruits_quiz.html`. Chỉ type `fill-in-the-blank` có trong fixture; không hỗ trợ dạng khác bằng suy đoán.

## P08-T01 — Parse quiz literal an toàn

**Mục tiêu:** Parse quiz meta và `QUIZ_DATA` từ static literal AST, đúng type/fields/count/order; dùng chung media utilities.

**File cần tạo/sửa:** `source/server/src/import/quiz-parser.ts`, `source/server/src/import/schemas.ts`, `source/server/src/shared/types.ts`.

**Spec liên quan:** F-08; `html-import.md` (quiz mappings/types/errors); `data-and-api.md` (quizzes/questions).

**Các bước làm:**
1. Mở toàn bộ `source/.ai/quiz/template/fruits_quiz.html`; kiểm tra metadata và 30 question object fields.
2. Dùng cùng safe static literal reader của topic parser; không execute code.
3. Parse `quiz-id`, `quiz-topic-id`, `quiz-title`, `quiz-type`, category/lang và QUIZ_DATA.
4. Zod validate, reject duplicate question IDs/unknown type/missing answer; count mismatch cảnh báo.
5. Không thêm options/IPA/audio/explanation riêng; map example fields đúng nghĩa.

**Tiêu chí hoàn thành:**
- [ ] `fruits_quiz.html` cho đúng quiz ID/topic/title/type và 30 questions.
- [ ] Mango question fields khớp nguồn exact.
- [ ] Unknown type hoặc non-literal script fail an toàn.
- [ ] Không để `chunk` lộ qua question display DTO.

**Phụ thuộc:** P04-T01, P02-T01.

## P08-T02 — Quiz import service và API

**Mục tiêu:** Tạo preview/confirm, duplicate overwrite/copy/cancel, link topic và atomic save cho quiz.

**File cần tạo/sửa:** `source/server/src/services/quiz-import-service.ts`, `source/server/src/db/repositories/quizzes.ts`, `source/server/src/routes/imports.ts`, `source/server/src/index.ts`.

**Spec liên quan:** F-08; `html-import.md` (duplicate/transaction/media); `data-and-api.md` (quiz import endpoints).

**Các bước làm:**
1. Đọc template quiz đầy đủ; đảm bảo liên kết `quiz-topic-id` cần topic tồn tại.
2. Dùng media staging/resolver chung và lưu preview opaque.
3. Confirm overwrite questions transactionally; preserve historical attempt snapshots.
4. Mount quiz preview/confirm route, mapping errors/status theo API spec.
5. Implement DELETE quiz và GET quiz list/detail projection không lộ answers.

**Tiêu chí hoàn thành:**
- [ ] Preview không ghi DB; confirm/overwrite atomic.
- [ ] Quiz list filter topic; delete giữ attempt snapshots.
- [ ] `chunk` không có trong GET payload trước khi submit.
- [ ] Media rollback/cleanup giống topic import.

**Phụ thuộc:** P08-T01, P04-T02–P04-T04, P02-T03.

## P08-T03 — Trang import quiz

**Mục tiêu:** Thực hiện flow 3 bước upload, preview, confirm; duplicate handling và thành công.

**File cần tạo/sửa:** `source/client/app/quizzes/new/page.tsx`, `source/client/components/import/quiz-import-preview.tsx`, `source/client/features/quizzes/quizzes-api.ts`, `source/client/features/quizzes/quiz-types.ts`.

**Spec liên quan:** F-08; `ui-design.md` (quiz import wireframe); `data-and-api.md` import contract.

**Các bước làm:**
1. Mở template `source/.ai/quiz/template/fruits_quiz.html`; dùng các field thật trong preview.
2. Reuse ImportDropzone/Stepper, submit HTML+companions.
3. Preview title/topic/type/count/warnings và list câu rút gọn, không render HTML.
4. Duplicate choice overwrite/create-copy/cancel; success chuyển tới quiz.
5. Có loading/error/cancel/accessibility.

**Tiêu chí hoàn thành:**
- [ ] Preview 30 câu đúng source order khi dùng fixture.
- [ ] Unknown type/missing topic/error thông báo tiếng Việt.
- [ ] Không có editor từng câu.
- [ ] Confirm chỉ bật khi validation pass.

**Phụ thuộc:** P03-T01, P03-T03, P08-T02.

## P08-T04 — Parser test quiz fixture

**Mục tiêu:** Khóa schema và fidelity quiz bằng test trên HTML template thực.

**File cần tạo/sửa:** `source/server/src/tests/import/quiz-parser.test.ts`, `source/server/package.json`.

**Spec liên quan:** F-08; `html-import.md` (quiz example/fidelity); `features.md` F-08.

**Các bước làm:**
1. Đọc toàn bộ `source/.ai/quiz/template/fruits_quiz.html` trực tiếp từ fixture path.
2. Assert 30 items, metadata, order, type và exact Mango fields.
3. Test unsupported type/missing chunk/duplicate ID/count mismatch.
4. Chạy test runner node:test cùng suite topic parser.

**Tiêu chí hoàn thành:**
- [ ] Không tạo file sample JSON/HTML bổ sung.
- [ ] Assertion kiểm tra giá trị/order, không chỉ count.
- [ ] Test pass cùng test parser topic.

**Phụ thuộc:** P08-T01.

## P08-T05 — Quiz list và question flow

**Mục tiêu:** Xây danh sách filter theo topic và giao diện làm một câu/màn hình, hỗ trợ fill-in-the-blank.

**File cần tạo/sửa:** `source/client/app/quizzes/page.tsx`, `source/client/app/quizzes/[quizId]/page.tsx`, `source/client/components/quizzes/quiz-question.tsx`, `source/client/features/quizzes/quiz-session.ts`.

**Spec liên quan:** F-09; `ui-design.md` (quiz list/run); `data-and-api.md` (quiz list/detail DTO).

**Các bước làm:**
1. Fetch quiz list, filter topic, actions start/delete.
2. Fetch question DTOs không answer key; display image/nameVi/meaningVi and text input.
3. Add progress bar, one-question navigation, Tiếp/Nộp, input validation.
4. Store answers client-side only until submit; support keyboard and mobile.
5. Handle empty/loading/error/no-question states.

**Tiêu chí hoàn thành:**
- [ ] Exactly one question shown at a time, progress accurate.
- [ ] Answer key is not delivered to browser before submit.
- [ ] Supports current type, no fake multiple-choice UI.
- [ ] Quiz delete/start/list actions are usable and accessible.

**Phụ thuộc:** P08-T02, P03-T03.

## P08-T06 — Chấm điểm và attempt history

**Mục tiêu:** Chấm authoritative ở server, chuẩn hóa câu trả lời chỉ để compare và lưu attempt snapshot.

**File cần tạo/sửa:** `source/server/src/services/quiz-attempt-service.ts`, `source/server/src/db/repositories/quiz-attempts.ts`, `source/server/src/routes/quizzes.ts`, `source/server/src/index.ts`.

**Spec liên quan:** F-09; `data-and-api.md` (attempts endpoints/schema); `features.md` F-09.

**Các bước làm:**
1. Nhận questionId/response, xác minh quiz-question membership và completeness.
2. Compare trim/lowercase/collapse whitespace; không biến đổi stored source values.
3. Tính score/percentage, lưu answers_json snapshot và completed_at transactionally.
4. Trả review result sau submit, GET history theo quiz.
5. Chặn submit duplicate qua request id/session behavior phù hợp; validate empty quiz.

**Tiêu chí hoàn thành:**
- [ ] Chấm điểm chạy server-side; client không thể sửa answer key.
- [ ] Score/percentage rounding theo spec.
- [ ] Attempt/review survives quiz re-import/delete via snapshot.
- [ ] Invalid/missing question IDs trả 400/422, không tạo history rác.

**Phụ thuộc:** P08-T02, P08-T05, P02-T01.

## P08-T07 — Quiz result/review UI

**Mục tiêu:** Hiển thị score, percentage, feedback, review câu đúng/sai và nút làm lại.

**File cần tạo/sửa:** `source/client/app/quizzes/[quizId]/result/page.tsx`, `source/client/components/quizzes/quiz-result-summary.tsx`, `source/client/components/quizzes/quiz-review-list.tsx`, `source/client/features/quizzes/quiz-attempts-api.ts`.

**Spec liên quan:** F-09; `ui-design.md` (result wireframe); `data-and-api.md` attempts response.

**Các bước làm:**
1. Nộp câu trả lời và nhận authoritative review snapshot.
2. Render score/count/percentage, response/answer, image và examples EN/VI.
3. Thêm animation nhẹ correct/incorrect và label text/icon.
4. Retry tạo attempt mới; link quay danh sách quiz.
5. Add loading/error/no result recovery.

**Tiêu chí hoàn thành:**
- [ ] Mỗi câu review có đúng/sai bằng text/icon, không chỉ màu.
- [ ] Chỉ hiển thị answer sau submit.
- [ ] Làm lại khởi tạo session/attempt mới.
- [ ] Reduced motion và screen reader summary hoạt động.

**Phụ thuộc:** P08-T05, P08-T06.
