# Điểm vào cho AI coder

## Dự án (5 dòng)

- Ứng dụng local học từ vựng tiếng Anh với giao diện tiếng Việt, dành cho một người dùng.
- Frontend dùng Next.js App Router, TypeScript và Tailwind CSS.
- Backend dùng Node.js, Express, REST API; dữ liệu lưu SQLite qua `better-sqlite3`.
- Import topic/quiz từ HTML bằng cheerio + parser literal an toàn, upload qua multer và validate bằng Zod.
- Tài liệu này cùng templates HTML là căn cứ triển khai; không tự suy diễn schema ngoài những gì đã ghi.

## Thứ tự đọc bắt buộc trước khi code

1. `README.md` ở root để biết cách chạy/backup.
2. `stucture/project-structure.md` rồi `stucture/coding-rules.md`.
3. `source/.ai/spec/features.md`, `data-and-api.md`, `html-import.md`, `ui-design.md`.
4. `source/.ai/plan-coding/00-overview.md`, `progress.md`, và phase/task được giao.
5. Khi task liên quan import chủ đề: đọc toàn bộ `source/.ai/content/template/*.html` trước khi sửa parser/test.
6. Khi task liên quan import quiz: đọc toàn bộ `source/.ai/quiz/template/*.html` trước khi sửa parser/test.
7. Khi task không liên quan import, không cần đọc lại template nếu ngữ cảnh phiên làm việc đã cung cấp đủ; nếu có bất kỳ ảnh hưởng schema/import nào thì phải đọc.

## Golden rules

- Chỉ làm task/phase được giao; không thêm feature ngoài plan, không refactor không liên quan.
- Template HTML thật là nguồn sự thật duy nhất về format. Không bịa field, selector, loại câu hỏi, media, options hay explanation.
- Không chạy JavaScript trong HTML import và không render HTML thô; parse metadata và literal tĩnh theo `source/.ai/spec/html-import.md`.
- Giữ nguyên thứ tự và nội dung nguồn (chỉ trim whitespace biên); không tự dịch, sửa, bổ sung dữ liệu.
- Nếu plan thiếu chi tiết, chọn phương án đơn giản nhất tương thích spec và ghi vào Assumptions khi thay đổi quyết định dài hạn; không mở rộng scope.
- Nếu hai tài liệu mâu thuẫn, dừng phần bị ảnh hưởng, ưu tiên template cho format dữ liệu, `features.md` cho hành vi, `data-and-api.md` cho contract, rồi cập nhật tài liệu liên quan trước khi code.
- Mỗi task sửa tối đa khoảng 5 file, chạy test/lint phù hợp, báo file thay đổi và kết quả kiểm tra.
- Không commit `.env`, DB runtime, staging, `uploads/` hoặc dữ liệu người dùng.

## Assumptions

- SQLite được chọn thay JSON vì cần quan hệ/transaction giữa từ, tiến độ, collection, quiz và lịch sử; vẫn giữ triển khai local đơn giản.
- Ứng dụng chính nằm ở `source/client` và `source/server`; thư mục `fe/` và `be/` là dự án legacy riêng, không thuộc workspace hiện hành.
- Template chủ đề có metadata meta tags và literal `TOPIC_METADATA`/`VOCAB_DATA`; template quiz có `QUIZ_METADATA`/`QUIZ_DATA`. HTML parser dùng cheerio cho HTML và Acorn AST cho literal tĩnh; không dùng `eval`.
- Template thực tế hiện có 30 từ và 30 câu quiz; quiz type quan sát được duy nhất là `fill-in-the-blank`.
- Template không có part of speech, IPA UK/US tách riêng, audio, lựa chọn đáp án hay explanation riêng. Không được tạo dữ liệu thay thế; chỉ render field nếu template tương lai thực sự cung cấp và spec được cập nhật.
- Fallback phát âm dùng SpeechSynthesis `en-US` theo tech stack; audio imported (nếu có trong template tương lai) luôn ưu tiên. Hai nút UK/US chỉ có giá trị accent thật khi nguồn có media tương ứng; nếu không, UI phải nói rõ fallback.
- Chủ đề/quiz định danh theo `topic-id`/`quiz-id`; preview staging tạm thời hết hạn sau 30 phút và được dọn khi cancel/confirm.
- Media companion được gửi cùng multipart request; relative path chỉ resolve trong package upload đã validate. Template hiện tại tham chiếu URL https Unsplash; data URI/relative path là capability yêu cầu, chưa có ví dụ trong template.
- Một hồ sơ local cố định, timezone thống kê là timezone local máy; quiz re-import giữ attempts bằng snapshot.
- Yêu cầu nhắc “PROMPT 2” không kèm mẫu cụ thể; câu lệnh cuối dùng prompt coding tương đương gắn đúng task đầu tiên P01-T01.

## Đánh dấu tiến độ

- Trong `plan-coding/progress.md` và checklist task, đổi `[ ]` thành `[x]` chỉ sau khi tiêu chí kiểm chứng được.
- Không đánh dấu hoàn thành nếu test/lint cần thiết đang lỗi; ghi rõ blocker thay vì đoán.
