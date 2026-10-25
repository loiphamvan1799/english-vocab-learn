# Phase 10 — Hoàn thiện

## P10-T01 — Responsive và accessibility audit

**Mục tiêu:** Rà soát các luồng chính trên viewport desktop/tablet/mobile, keyboard, focus, contrast và reduced motion; sửa các lỗi blocker.

**File cần tạo/sửa:** `source/client/app/globals.css`, `source/client/components/layout/app-navbar.tsx`, `source/client/components/topics/flashcard.tsx`, `source/client/components/quizzes/quiz-question.tsx`, `source/client/components/import/import-dropzone.tsx`.

**Spec liên quan:** F-12; `ui-design.md` (tokens/responsive/motion); F-02, F-04, F-07, F-09.

**Các bước làm:**
1. Kiểm tra viewport 375px, tablet khoảng 768px, desktop 1280px.
2. Sử dụng keyboard-only cho menu, upload, flashcard, quiz controls.
3. Sửa focus trap/order, target size, labels/alt, contrast theo WCAG AA cơ bản.
4. Test `prefers-reduced-motion`; đảm bảo animation không bắt buộc để hiểu trạng thái.
5. Không thay đổi flow nghiệp vụ ngoài spec.

**Tiêu chí hoàn thành:**
- [ ] Không horizontal overflow ở các viewport đã chọn.
- [ ] Keyboard focus visible và order hợp lý.
- [ ] Upload/speaker/icon buttons có accessible name.
- [ ] Reduced motion tắt/làm nhẹ animation.

**Phụ thuộc:** P03-T03, P04-T05, P06-T04, P08-T05.

## P10-T02 — Hoàn thiện loading/empty/error

**Mục tiêu:** Audit các route để mọi trang có states đủ dùng và phản hồi API lỗi nhất quán.

**File cần tạo/sửa:** `source/client/app/page.tsx`, `source/client/app/topics/[topicId]/page.tsx`, `source/client/app/collections/page.tsx`, `source/client/app/quizzes/page.tsx`, `source/client/app/statistics/page.tsx`.

**Spec liên quan:** F-01–F-12; `ui-design.md` (shared states); `features.md` từng state.

**Các bước làm:**
1. Kiểm tra loading/empty/error cho dashboard, topic, collection, quiz, statistics.
2. Thêm CTA phù hợp: topic empty → Thêm chủ đề; quiz empty → Thêm quiz; collection empty → lưu từ.
3. Thêm retry chỉ với lỗi transient; không hiển thị dữ liệu cũ như đã lưu nếu API thất bại.
4. Kiểm tra 404/deleted resource và thông báo tiếng Việt.
5. Đảm bảo skeleton không thay đổi layout quá nhiều.

**Tiêu chí hoàn thành:**
- [ ] Mỗi trang chính có loading, empty và error state đúng ngữ cảnh.
- [ ] CTA điều hướng đúng nơi.
- [ ] Error không lộ stack/HTML nguồn.
- [ ] Retry và cancel không tạo duplicate action.

**Phụ thuộc:** P05-T02, P06-T01, P07-T04, P08-T05, P09-T03.

## P10-T03 — Fidelity, release và README

**Mục tiêu:** Kiểm chứng import bằng hai HTML templates thật, hoàn thành smoke test và tạo hướng dẫn chạy/backup root ngắn gọn.

**File cần tạo/sửa:** `README.md`, `source/server/src/tests/import/topic-parser.test.ts`, `source/server/src/tests/import/quiz-parser.test.ts`, `package.json`.

**Spec liên quan:** F-07, F-08, F-12; `html-import.md` (fidelity checklist); `data-and-api.md` (ports/storage/backup).

**Các bước làm:**
1. Mở và đọc toàn bộ `source/.ai/content/template/fruits.html` và `source/.ai/quiz/template/fruits_quiz.html`.
2. Chạy parser tests trực tiếp trên hai fixture; kiểm tra item count/order/every mapped field/media refs và transaction rollback.
3. Chạy install, typecheck, lint, tests, build và smoke test `npm run dev`.
4. Viết root README tối đa khoảng 60 dòng: Node version, cài đặt/chạy, ports, import, DB/uploads, backup.
5. Đối chiếu README là hướng dẫn chạy duy nhất; không tạo thêm docs ngoài deliverables.

**Tiêu chí hoàn thành:**
- [ ] Cả hai template thật import đúng count/order, metadata và fields exact.
- [ ] Không có code chạy HTML script, media sai item, file rác sau rollback.
- [ ] Root `npm run dev` chạy client+server; build/lint/test pass.
- [ ] README ≤60 dòng, backup `vocabulary.db` và uploads được hướng dẫn.
- [ ] Không có sample-data/JSON fixtures hoặc file thừa.

**Phụ thuộc:** Tất cả P01–P09; P04-T06, P08-T04.
