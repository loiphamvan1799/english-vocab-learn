# Đặc tả chức năng

Giao diện hoàn toàn bằng tiếng Việt. Dữ liệu tiếng Anh trong import giữ nguyên. Các trạng thái chung của mọi trang: loading, empty, error; empty có hướng dẫn/nút hành động liên quan. Acceptance checklist là tiêu chí nghiệm thu.

## F-01 — Trang chủ và tổng quan

**Mô tả:** Dashboard hiển thị tiếp tục học, chỉ số tổng quan và lưới chủ đề. Chỉ số được định nghĩa ở `data-and-api.md`; không suy luận tiến độ từ số lần render.

**Hành vi:** “Tiếp tục học” mở chủ đề gần nhất tại `current_word_position`; nếu chưa có progress thì gợi ý chủ đề đầu tiên. Hiển thị số từ đã học, tỷ lệ mastered, streak, số từ hôm nay/mục tiêu. Card chủ đề có icon/ảnh (fallback), số từ, progress, trạng thái Chưa học/Đang học/Hoàn thành.

**Trạng thái/edge:** Loading skeleton; chưa có topic hướng dẫn “Thêm chủ đề”; chưa có progress gợi ý bắt đầu; topic rỗng hiển thị 0%/chưa hoàn thành; API lỗi có retry.

**Chấp nhận:**
- [ ] Continue mở đúng topic và đúng vị trí lưu.
- [ ] Topic card có title, số từ, progress, status và action mở topic.
- [ ] Overview cập nhật sau hành động học; streak/ngày dùng timezone local.
- [ ] Empty/error/loading hiển thị riêng, có thể truy cập bằng bàn phím.

## F-02 — Điều hướng, chuyển chủ đề và tìm kiếm nhanh

**Mô tả:** Navbar có Trang chủ, Chủ đề (switcher), Bộ sưu tập, Quiz, Thống kê, Hồ sơ, Thêm chủ đề và tìm kiếm từ.

**Hành vi:** Topic switcher liệt kê mọi chủ đề, highlight chủ đề đang học gần nhất/đang xem; chọn một lần điều hướng thẳng. Search debounce nhẹ, kết quả gồm cụm, nghĩa, tên topic và link tới từ.

**Trạng thái/edge:** Empty topic list dẫn tới import; search empty/no result/error; mobile menu đóng sau điều hướng; không coi “đang xem” là trạng thái progress.

**Chấp nhận:**
- [ ] Mọi liên kết điều hướng đúng trang.
- [ ] Topic đang học được highlight có nhãn/text, không chỉ đổi màu.
- [ ] Tìm kiếm không phân biệt hoa thường, nhưng không sửa dữ liệu nguồn; giới hạn kết quả.
- [ ] Navbar responsive và có focus/menu keyboard semantics.

## F-03 — Học từ theo chủ đề

**Mô tả:** Topic detail cung cấp danh sách card và chế độ Flashcard. Hiển thị mọi trường có trong template: `nameVi`, `chunk`, `ipa`, `meaningVi`, `imageUrl`, `exampleEn`, `exampleVi`, cộng metadata topic `title/category/level/lang/description`. `part_of_speech`, IPA UK/US và audio chỉ hiển thị nếu template nguồn tương lai cung cấp; hiện tại không có.

**Hành vi:** Card nhấn mạnh cụm tiếng Anh; ví dụ highlight phần giữa `[[...]]` an toàn. Danh sách và flashcard chuyển chế độ mà không mất vị trí học. Mỗi card có ảnh/placeholder, nghĩa, IPA, ví dụ EN/VI và nút phát âm.

**Trạng thái/edge:** Ảnh lỗi dùng fallback; topic không có từ là empty/error dữ liệu; danh sách dài tải/scroll mượt; nội dung dài wrap không cắt mất dữ liệu.

**Chấp nhận:**
- [ ] Mỗi trường tồn tại trong nguồn được hiển thị đúng, theo thứ tự import.
- [ ] Không xuất hiện POS/IPA/audio giả khi không có trong nguồn.
- [ ] Highlight `[[...]]` bằng text node/mark an toàn, không dùng HTML thô.
- [ ] Nút speaker có aria-label, trạng thái đang phát và hoạt động không làm mất focus.

## F-04 — Flashcard và phát âm

**Mô tả:** Lật thẻ 3D, nút Trước/Sau, Đã thuộc; phát âm audio nguồn trước, Web Speech API en-US khi nguồn không có audio.

**Hành vi:** Mặt trước hiển thị cụm/ảnh; mặt sau nghĩa, IPA, ví dụ và bản dịch. Nút UK/US riêng nếu có dữ liệu/audio theo accent; với template hiện tại không có audio tách accent nên fallback được cấu hình en-US như yêu cầu tech stack. Không tự chọn voice UK giả lập.

**Trạng thái/edge:** SpeechSynthesis không hỗ trợ/voices chưa load thì báo nhẹ; thay từ thì dừng audio đang chạy; lật card hỗ trợ bàn phím; reduce-motion bỏ lật 3D.

**Chấp nhận:**
- [ ] Trước/Sau giữ đúng thứ tự và không vượt biên (disable hoặc wrap theo một hành vi thống nhất).
- [ ] Đánh dấu Đã thuộc lưu ngay; thẻ phản ánh trạng thái đã lưu.
- [ ] Imported audio (nếu sau này có) luôn được ưu tiên hơn SpeechSynthesis.
- [ ] Không có audio template: fallback đọc `chunk` bằng `en-US`; không phát âm dựa trên IPA.

## F-05 — Tiến độ học và tiếp tục

**Mô tả:** Lưu từ đã học, trạng thái mastered và vị trí học dở. Topic status derive Not started → In progress → Completed.

**Hành vi:** Mở từ ghi study event; đổi vị trí lưu `current_word_position`; mastered cập nhật progress và tổng quan. Completed chỉ khi tổng từ > 0 và mọi từ mastered.

**Trạng thái/edge:** Topic mới, topic được overwrite, từ bị xóa/đổi ID, API lỗi mạng. Vị trí clamp về phạm vi sau import mới.

**Chấp nhận:**
- [ ] Học ít nhất một từ chuyển topic sang In progress.
- [ ] Chỉ mastered 100% mới Completed.
- [ ] Tiếp tục học mở đúng từ; position được lưu bền vững.
- [ ] Overwrite giữ tiến độ các từ có cùng source ID, từ mới bắt đầu chưa học.

## F-06 — Bộ sưu tập

**Mô tả:** Nhiều collection tên tùy chỉnh, default “Yêu thích”; add/remove word; create/rename/delete collection.

**Hành vi:** Từ có thể ở nhiều collection; thêm từ đã có là idempotent. Xóa collection default không cho phép; xóa từ khỏi collection không xóa word.

**Trạng thái/edge:** Empty collection có hướng dẫn lưu từ; tên trùng/blank validation; word/topic bị xóa làm quan hệ tự xóa.

**Chấp nhận:**
- [ ] Cài đặt lần đầu tạo đúng một collection “Yêu thích”.
- [ ] Thêm/bỏ từ cập nhật UI và DB; không tạo duplicate.
- [ ] Tạo/đổi tên/xóa collection hoạt động, default được bảo vệ.
- [ ] Loading/empty/error có feedback và retry phù hợp.

## F-07 — Import chủ đề HTML

**Mô tả:** Kéo-thả/chọn HTML và media companion → preview → confirm → điều hướng tới topic. Parse contract duy nhất tại `html-import.md`.

**Hành vi:** Preview title/count/short word list/media warnings/validation errors; duplicate cho phép overwrite giữ progress, create-copy, cancel. Xóa topic có confirm. Import transaction, không render file HTML.

**Trạng thái/edge:** Không có file, sai extension/corrupt, size quá lớn, script thiếu/không literal, metadata conflict, count mismatch, thiếu media, URL tải lỗi, duplicate, confirm lỗi.

**Chấp nhận:**
- [ ] Upload đúng `source/.ai/content/template/fruits.html` parse 30 items theo thứ tự và giá trị nguồn.
- [ ] Preview không thay DB; confirm chỉ khi validation pass.
- [ ] Relative/external/data URI media theo policy; path traversal bị từ chối.
- [ ] Failure rollback DB và dọn file mới; warning hiển thị tiếng Việt.
- [ ] Template HTML thật được mở khi thực hiện task import; có test parser.

## F-08 — Import quiz HTML và quản trị quiz

**Mô tả:** Chỉ import, xóa, re-import overwrite; không soạn/sửa từng câu trên UI. Cơ chế import theo `html-import.md`.

**Hành vi:** Preview metadata/count/items; chỉ format type trong template được hỗ trợ (`fill-in-the-blank`). Conflict overwrite/copy/cancel. Quiz liên kết topic ID; default yêu cầu topic tồn tại.

**Trạng thái/edge:** Unknown type, missing topic, duplicate ID, answer missing, count mismatch, media missing, upload/parser errors.

**Chấp nhận:**
- [ ] `fruits_quiz.html` preview có 30 câu fill-in-the-blank đúng thứ tự.
- [ ] `chunk` là answer key; không lộ trước khi submit.
- [ ] `exampleEn`/`exampleVi` hiển thị trong review; không tạo explanation/options giả.
- [ ] Không có UI tạo/sửa question thủ công; xóa và re-import có.

## F-09 — Danh sách, làm bài và kết quả quiz

**Mô tả:** Danh sách quiz có filter topic; làm từng câu/màn hình, tiến độ, chọn/nhập answer, Tiếp/Nộp; kết quả điểm, phần trăm, review đúng sai/ngữ cảnh và Làm lại.

**Hành vi:** Với quiz template, input là text fill-in-the-blank. Chấm tự động khi submit, trim/collapse whitespace/lowercase chỉ khi so sánh. Lưu attempt và snapshot; mỗi câu có animation nhẹ đúng/sai.

**Trạng thái/edge:** Quiz empty, chưa chọn đáp án, submit giữa chừng, replay, topic/quiz bị xóa, API failure, total 0 (không cho làm).

**Chấp nhận:**
- [ ] Một câu trên màn hình, tiến độ hiển thị rõ, submit không lặp.
- [ ] Tính đúng/sai theo answer key; score và percentage chính xác.
- [ ] Kết quả có review từng câu, câu trả lời người dùng, đúng/sai, đáp án và example EN/VI.
- [ ] Attempt lưu và hiển thị trong history; Làm lại tạo attempt mới.
- [ ] Không gửi answer key về client trước submit; server chấm authoritative.

## F-10 — Hồ sơ và mục tiêu

**Mô tả:** Một hồ sơ local gồm tên, avatar emoji có sẵn, mục tiêu từ/ngày.

**Hành vi:** Load/save profile; goal là số nguyên dương. Không cần login.

**Trạng thái/edge:** Profile chưa seed dùng default nhẹ nhàng; name blank/goal invalid báo lỗi inline.

**Chấp nhận:**
- [ ] Tên, avatar allowlist và daily goal lưu/đọc sau reload.
- [ ] Không có auth, password hoặc dữ liệu user phức tạp.
- [ ] Form keyboard accessible, validation tiếng Việt.

## F-11 — Thống kê

**Mô tả:** Tổng từ đã học, chủ đề hoàn tất, streak, chart 7/30 ngày, topic progress, quiz history/scores.

**Hành vi:** Range selector 7/30 ngày; empty chart có zero states; biểu đồ có text/table summary để accessibility.

**Trạng thái/edge:** Chưa có study logs/quiz attempts, ngày không có học, topic deleted nhưng quiz attempt history vẫn còn.

**Chấp nhận:**
- [ ] Tổng số, streak, daily series, topic status dùng đúng định nghĩa data spec.
- [ ] Chọn 7/30 ngày cập nhật chart.
- [ ] Quiz history hiển thị title snapshot (nếu topic/quiz bị xóa vẫn có thông tin attempt cần thiết).
- [ ] Chart có nhãn/summary cho screen reader, loading/error/empty.

## F-12 — Responsive, accessibility và trạng thái hệ thống

**Mô tả:** Hoàn thiện trải nghiệm mọi route theo UI spec: responsive, WCAG AA cơ bản, loading/empty/error.

**Hành vi:** Mobile-first; reduced-motion; focus order; API error tiếng Việt có retry khi hợp lý.

**Chấp nhận:**
- [ ] Layout usable tại mobile/tablet/desktop, không tràn ngang.
- [ ] Focus ring, semantic headings/labels, alt text, aria-label speaker, contrast đạt AA cho nội dung.
- [ ] Skeleton không gây layout shift lớn; lỗi có thông điệp và thao tác phục hồi.
- [ ] Tất cả animation tôn trọng `prefers-reduced-motion`.
