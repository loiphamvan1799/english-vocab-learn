# Phase 05 — Trang chủ

## P05-T01 — Dashboard API và summary

**Mục tiêu:** Tạo endpoint tổng quan tổng hợp topics, resume position, study totals, streak và daily goal từ SQLite.

**File cần tạo/sửa:** `source/server/src/services/dashboard-service.ts`, `source/server/src/db/repositories/progress.ts`, `source/server/src/routes/dashboard.ts`, `source/server/src/index.ts`.

**Spec liên quan:** F-01; `data-and-api.md` (progress definitions); `features.md` F-01.

**Các bước làm:**
1. Tính word count/mastered/status theo định nghĩa, không duplicate logic UI.
2. Lấy latest topic/position để Continue Learning.
3. Tính học hôm nay và streak theo timezone local đã chọn.
4. Expose GET `/api/dashboard` qua response envelope và handle empty state.
5. Test 0 topic, topic chưa học, đang học, complete.

**Tiêu chí hoàn thành:**
- [ ] Summary values khớp DB fixture/test state.
- [ ] Topic status không dựa client state.
- [ ] Empty dashboard trả hợp lệ không phải 500.
- [ ] Query tránh N+1 nếu aggregate đơn giản được.

**Phụ thuộc:** P02-T01, P02-T03, P07-T01.

## P05-T02 — Trang chủ và topic cards

**Mục tiêu:** Xây dashboard responsive: continue, overview KPIs, goal/streak và topic grid.

**File cần tạo/sửa:** `source/client/app/page.tsx`, `source/client/components/topics/topic-card.tsx`, `source/client/features/topics/dashboard-api.ts`, `source/client/features/topics/dashboard-types.ts`.

**Spec liên quan:** F-01; `ui-design.md` (home wireframe/TopicCard); F-02 navbar.

**Các bước làm:**
1. Fetch dashboard summary bằng typed API client.
2. Render resume CTA tới đúng topic/position; daily goal và streak.
3. Render cards có title/count/progress/status/image fallback.
4. Thêm loading/empty/error; empty state dẫn “Thêm chủ đề”.
5. Kiểm tra desktop/mobile, tab order và text status.

**Tiêu chí hoàn thành:**
- [ ] Continue mở đúng từ đã lưu.
- [ ] Topic grid hiển thị Not started/In progress/Completed tiếng Việt.
- [ ] Empty state có CTA import.
- [ ] Không có fake progress/demo data.

**Phụ thuộc:** P03-T01–P03-T03, P05-T01.
