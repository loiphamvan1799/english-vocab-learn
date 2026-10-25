# Phase 09 — Hồ sơ + Thống kê

## P09-T01 — Hồ sơ và daily goal

**Mục tiêu:** Đọc/cập nhật hồ sơ local: tên, avatar allowlist và mục tiêu từ/ngày.

**File cần tạo/sửa:** `source/server/src/services/profile-service.ts`, `source/server/src/db/repositories/profile.ts`, `source/server/src/routes/profile.ts`, `source/server/src/index.ts`, `source/client/app/profile/page.tsx`.

**Spec liên quan:** F-10; `data-and-api.md` (`user_profile`, profile endpoints); `ui-design.md` (profile wireframe).

**Các bước làm:**
1. Implement GET/PUT profile với Zod và fixed local user id.
2. Validate avatar thuộc danh sách emoji đã định nghĩa và daily goal integer dương.
3. Tạo form tiếng Việt load/save với inline validation.
4. Handle default profile, pending/error/success state.
5. Test reload persistence.

**Tiêu chí hoàn thành:**
- [ ] Name/avatar/goal đọc ghi được qua API.
- [ ] Không auth/password/user switching.
- [ ] Input invalid trả lỗi rõ ràng, không save.
- [ ] Form keyboard accessible.

**Phụ thuộc:** P02-T01–P02-T03, P03-T03.

## P09-T02 — Statistics API

**Mục tiêu:** Cung cấp totals, daily series 7/30 ngày, topic progress và quiz history theo data definitions.

**File cần tạo/sửa:** `source/server/src/services/statistics-service.ts`, `source/server/src/db/repositories/statistics.ts`, `source/server/src/routes/statistics.ts`, `source/server/src/index.ts`.

**Spec liên quan:** F-11; `data-and-api.md` (statistics endpoint/streak); F-05, F-09.

**Các bước làm:**
1. Tính learned words, completed topics, streak và daily distinct words.
2. Query 7/30 ngày inclusive theo timezone local policy; trả zero-filled ngày thiếu.
3. Lấy topic progress và quiz attempts theo thời gian.
4. Validate range input và giới hạn lịch sử.
5. Test no data, sparse logs, boundary dates và deleted quiz snapshot.

**Tiêu chí hoàn thành:**
- [ ] Số liệu tuân đúng definitions trong data spec.
- [ ] 7d/30d trả đúng số điểm theo thời gian.
- [ ] Không có log trả zeros/empty, không lỗi.
- [ ] SQL parameterized, output typed.

**Phụ thuộc:** P07-T01–P07-T03, P08-T06, P02-T01.

## P09-T03 — Trang thống kê

**Mục tiêu:** Render KPI, daily study chart, topic progress và quiz history, với accessible textual summary.

**File cần tạo/sửa:** `source/client/app/statistics/page.tsx`, `source/client/components/statistics/study-chart.tsx`, `source/client/components/statistics/topic-progress-list.tsx`, `source/client/features/profile/statistics-api.ts`.

**Spec liên quan:** F-11; `ui-design.md` (statistics wireframe); `data-and-api.md` statistics response.

**Các bước làm:**
1. Fetch range mặc định 7 ngày; cho đổi 7/30.
2. Render KPIs/progress/history từ API, không tự tính khác.
3. Dùng chart đơn giản (CSS/SVG hoặc dependency đã có) và cung cấp table/summary accessible.
4. Xử lý empty/loading/error, label số và ngày bằng tiếng Việt.
5. Kiểm tra mobile responsive.

**Tiêu chí hoàn thành:**
- [ ] Chuyển range thay đổi chart và data range.
- [ ] Empty state giải thích chưa có hoạt động.
- [ ] Chart có text alternative.
- [ ] Topic/quiz values khớp API.

**Phụ thuộc:** P09-T02, P03-T03.
