# Phase 07 — Tiến độ học + Bộ sưu tập

## P07-T01 — Lưu tiến độ học

**Mục tiêu:** Ghi từ đã học, mastered, study log và vị trí hiện tại qua API/DB.

**File cần tạo/sửa:** `source/server/src/services/progress-service.ts`, `source/server/src/db/repositories/progress.ts`, `source/server/src/routes/progress.ts`, `source/server/src/index.ts`.

**Spec liên quan:** F-05; `data-and-api.md` (word_progress/topic_progress/study_log); F-01/F-04.

**Các bước làm:**
1. Đọc data status definition; tạo endpoint PATCH word progress và PUT topic position.
2. Mỗi học event ghi study log idempotently theo ý nghĩa (không tạo log vô hạn chỉ vì rerender).
3. Clamp position hợp lệ theo word count.
4. Recompute status/progress từ DB state; validate ownership local/FK.
5. Test mastered toggle và persistence.

**Tiêu chí hoàn thành:**
- [ ] Từ đầu tiên tạo In progress; 100% mastered mới Completed.
- [ ] Position lưu và đọc lại được.
- [ ] Request sai type/out-of-range trả lỗi phù hợp.
- [ ] API không phụ thuộc client tính phần trăm.

**Phụ thuộc:** P02-T01–P02-T03.

## P07-T02 — Resume và trạng thái topic

**Mục tiêu:** Nối UI học với progress API và bảo đảm Continue Learning mở chính xác item.

**File cần tạo/sửa:** `source/client/features/progress/progress-api.ts`, `source/client/features/progress/use-word-progress.ts`, `source/client/components/topics/word-card.tsx`, `source/client/app/topics/[topicId]/page.tsx`.

**Spec liên quan:** F-01, F-04, F-05; `features.md` F-05; `data-and-api.md` (progress endpoints).

**Các bước làm:**
1. Tạo typed methods load/update progress.
2. Khi vào topic, focus/scroll tới current position từ resume link.
3. Mastered action cập nhật optimistic-safe, rollback khi lỗi.
4. Save current position khi chuyển từ và khi rời page theo điểm an toàn.
5. Hiển thị status/progress rõ ràng ở header.

**Tiêu chí hoàn thành:**
- [ ] Resume từ dashboard quay đúng topic + word.
- [ ] Progress thay đổi đồng bộ sau response server.
- [ ] Error save có retry/feedback, không báo thành công giả.
- [ ] Refresh page không làm mất vị trí.

**Phụ thuộc:** P05-T02, P06-T01–P06-T04, P07-T01.

## P07-T03 — Collection API

**Mục tiêu:** Tạo CRUD collection và add/remove words, bảo vệ collection mặc định.

**File cần tạo/sửa:** `source/server/src/db/repositories/collections.ts`, `source/server/src/services/collections-service.ts`, `source/server/src/routes/collections.ts`, `source/server/src/index.ts`.

**Spec liên quan:** F-06; `data-and-api.md` (collections/collection_words); API table.

**Các bước làm:**
1. Query collections/count và words by collection.
2. Thêm create/rename/delete; validate tên và duplicate.
3. Chặn xóa default collection; add/remove word idempotent.
4. Map missing IDs/FK errors sang 404/409.
5. Test collection lifecycle.

**Tiêu chí hoàn thành:**
- [ ] Default “Yêu thích” seed một lần và không xóa được.
- [ ] CRUD và add/remove trả status/envelope đúng.
- [ ] Không tạo duplicate membership.
- [ ] SQL parameterized.

**Phụ thuộc:** P02-T01, P02-T03.

## P07-T04 — Collection UI

**Mục tiêu:** Tạo trang collection, management controls và gắn nút save vào word cards.

**File cần tạo/sửa:** `source/client/app/collections/page.tsx`, `source/client/components/topics/collection-picker.tsx`, `source/client/features/collections/collections-api.ts`, `source/client/features/collections/collection-types.ts`.

**Spec liên quan:** F-06; `ui-design.md` (collections wireframe); `features.md` F-06.

**Các bước làm:**
1. Fetch/render collection list và selected collection words.
2. Tạo modal/form create/rename/delete với xác nhận xóa.
3. Cho phép add/remove từ collection picker trong WordCard flow.
4. Có empty/loading/error states; default collection được đánh dấu.
5. Validate keyboard/focus, mobile list layout.

**Tiêu chí hoàn thành:**
- [ ] User tạo/đổi tên/xóa collection, không xóa default.
- [ ] Add/remove từ UI cập nhật sau server response.
- [ ] Empty collection hướng dẫn lưu từ.
- [ ] Data survives reload.

**Phụ thuộc:** P03-T03, P06-T02, P07-T03.
