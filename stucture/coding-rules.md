# Quy tắc coding

Checklist cho mọi thay đổi. Ưu tiên KISS/YAGNI; phạm vi nghiệp vụ và dữ liệu được định nghĩa trong `source/.ai/spec/`.

## Naming và cấu trúc

- [ ] File/folder `kebab-case`; component/type/interface `PascalCase`; function/variable `camelCase`; hằng số `UPPER_SNAKE_CASE`.
- [ ] Một file có một trách nhiệm chính. UI theo feature; route chỉ parse request/response và gọi service.
- [ ] Không tạo alias/phân tầng phức tạp nếu chưa có nhu cầu.
- ✅ `topic-parser.ts`, `function parseTopicHtml()`, `type ParsedTopic`
- ❌ `TopicParserFinal.ts`, SQL trong Express route, component page chứa parser HTML.

## TypeScript

- [ ] Bật `strict`; tránh `any`, dùng `unknown` ở biên rồi validate/narrow.
- [ ] Validate mọi input ngoài hệ thống bằng Zod; TypeScript type không thay thế runtime validation.
- [ ] Ưu tiên type inference và kiểu dữ liệu domain tường minh; không ép kiểu để lờ lỗi.
- ✅ `const parsed = schema.safeParse(input); if (!parsed.success) ...`
- ❌ `const body = req.body as ImportPayload` mà không validate.

## React / Next.js

- [ ] Mặc định dùng Server Component; chỉ thêm `"use client"` khi cần state/effect, event handler, browser API hoặc thư viện client.
- [ ] Giữ Client Component nhỏ, gần nơi cần tương tác; không đưa secret/server logic vào bundle.
- [ ] Không truy cập `window`, `localStorage`, `SpeechSynthesis` trong render phía server.
- [ ] Dùng semantic HTML, key ổn định, không render HTML nhập khẩu bằng `dangerouslySetInnerHTML`.

## Tailwind và UI

- [ ] Dùng design tokens ở `app/globals.css` và mapping Tailwind; không hardcode màu tùy tiện.
- [ ] Reuse component và spacing tokens; trạng thái hover/focus/loading/empty/error phải có thiết kế.
- ✅ `bg-primary`, `text-foreground`, `rounded-card`
- ❌ `bg-[#f7c7d9]` lặp lại khắp component.

## API và lỗi

- [ ] REST endpoint dùng danh từ số nhiều, JSON response thống nhất `{ data, error }`.
- [ ] Dùng mã HTTP phù hợp: `200/201/204`, `400` input, `404` không có tài nguyên, `409` conflict, `413` upload quá lớn, `422` dữ liệu HTML không hợp lệ, `500` lỗi không dự kiến.
- [ ] Lỗi được chuyển qua centralized error handler; thông báo public bằng tiếng Việt, log không chứa nội dung nhạy cảm.
- [ ] CORS chỉ cho origin local đã cấu hình; mọi endpoint ghi dữ liệu validate bằng Zod.

## Import order và chất lượng

- [ ] Thứ tự import: built-in/external → alias nội bộ → relative; mỗi nhóm cách nhau một dòng.
- [ ] Hàm ngắn, tên biểu đạt ý định; không magic number, code chết, hoặc comment nhắc lại code.
- [ ] Comment chỉ giải thích lý do/constraint không hiển nhiên.
- [ ] Dùng ESLint/Prettier/EditorConfig; test parser bằng `node:test` và HTML template thật.

## Upload và parse an toàn

- [ ] Chỉ nhận `.html`, giới hạn size, kiểm tra MIME như tín hiệu phụ (không tin MIME đơn lẻ), kiểm tra cấu trúc sau parse.
- [ ] Không chạy JavaScript trong file HTML; không dùng headless browser; chỉ đọc meta/data và media theo selector được đặc tả.
- [ ] Không render HTML thô; lấy text/attribute, escape theo output context.
- [ ] Chặn path traversal; chỉ cho phép file đã upload trong package, kiểm tra real path nằm trong staging root.
- [ ] Giới hạn URL tải media và kích thước/time-out; không theo redirect sang private/local IP; media tải lỗi thì cảnh báo và giữ URL ngoài nếu hợp lệ.
- [ ] Ghi media staging trước; dùng DB transaction; rollback DB và xóa media mới nếu lỗi.

## Accessibility

- [ ] Tương phản WCAG AA, focus ring nhìn thấy, label cho input, alt text ảnh, `aria-label` loa/nút icon.
- [ ] Không dùng màu là tín hiệu duy nhất; tôn trọng `prefers-reduced-motion`; thao tác được bằng bàn phím.

## Git và phạm vi

- [ ] Commit theo Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`.
- [ ] Được làm: đúng task/spec, test tối thiểu liên quan, sửa docs khi contract đổi.
- [ ] Không được làm: mở rộng ngoài plan, thêm auth/microservice/ORM nặng, tự sửa/dịch/bổ sung dữ liệu import, thêm dependency không cần, commit `.env`, DB, `uploads/`.
