# Phase 03 — Layout chung + Navbar

## P03-T01 — API client và UI primitives

**Mục tiêu:** Tạo API client typed và primitives dùng chung cho thao tác/feedback, không kéo framework mới không cần thiết.

**File cần tạo/sửa:** `source/client/lib/api-client.ts`, `source/client/components/ui/button.tsx`, `source/client/components/ui/progress-bar.tsx`, `source/client/components/ui/empty-state.tsx`, `source/client/components/ui/error-state.tsx`.

**Spec liên quan:** `data-and-api.md` (response envelope); `ui-design.md` (components/tokens); F-12.

**Các bước làm:**
1. Cấu hình API base URL từ env và parse `{data,error}`.
2. Chuẩn hóa lỗi client có code/message, không swallow error.
3. Tạo Button với variants/focus/disabled và ProgressBar accessible.
4. Tạo EmptyState/ErrorState reusable có actions rõ ràng.
5. Kiểm tra keyboard focus và responsive behavior.

**Tiêu chí hoàn thành:**
- [ ] API client typed, không dùng `any`.
- [ ] Buttons có focus ring và states.
- [ ] Progress có accessible value/label.
- [ ] UI primitives lấy màu từ tokens.

**Phụ thuộc:** P01-T03, P02-T03.

## P03-T02 — Navbar và topic switcher

**Mục tiêu:** Tạo navigation toàn cục theo yêu cầu, gồm topic switcher active state và search từ nhanh.

**File cần tạo/sửa:** `source/client/components/layout/app-navbar.tsx`, `source/client/components/layout/topic-switcher.tsx`, `source/client/features/topics/topics-api.ts`, `source/client/features/topics/topic-types.ts`.

**Spec liên quan:** F-02; `ui-design.md` (AppNavbar/TopicSwitcher); `data-and-api.md` (topics/search).

**Các bước làm:**
1. Tạo typed API methods để lấy topics và search words.
2. Render links Trang chủ, Chủ đề, Bộ sưu tập, Quiz, Thống kê, Hồ sơ.
3. Thêm CTA “Thêm chủ đề”, active topic highlight và switch 1 click.
4. Thêm search input với debounce, keyboard navigation và result links.
5. Tạo mobile menu; đóng menu sau navigation.

**Tiêu chí hoàn thành:**
- [ ] Link/CTA đúng route, active state không chỉ dựa màu.
- [ ] Topic switcher có empty/error/loading states.
- [ ] Search không gọi API cho query trống, kết quả có thể chọn bằng bàn phím.
- [ ] Navbar usable trên màn nhỏ.

**Phụ thuộc:** P03-T01, P02-T03.

## P03-T03 — App layout và shared states

**Mục tiêu:** Gắn navbar/common layout vào mọi trang và thống nhất skeleton/loading/dialog semantics tối thiểu.

**File cần tạo/sửa:** `source/client/app/layout.tsx`, `source/client/app/globals.css`, `source/client/components/layout/page-container.tsx`, `source/client/components/ui/skeleton.tsx`, `source/client/components/ui/modal.tsx`.

**Spec liên quan:** `ui-design.md` (tokens/responsive); F-02, F-12.

**Các bước làm:**
1. Gắn AppNavbar vào layout chung; không biến toàn bộ app thành client nếu không cần.
2. Tạo PageContainer với heading/action slots.
3. Bổ sung skeleton variants và modal accessible cho confirm.
4. Hoàn thiện CSS tokens/spacing và reduced-motion rules.
5. Kiểm tra layout ở mobile/desktop bằng các page placeholder hiện có.

**Tiêu chí hoàn thành:**
- [ ] Navbar dùng chung, không duplicate.
- [ ] Modal có focus management, escape/cancel và trả focus.
- [ ] Reduced motion được tôn trọng.
- [ ] Không có horizontal overflow ở breakpoint chính.

**Phụ thuộc:** P03-T01, P03-T02.
