# Plan coding — tổng quan

## Nguyên tắc thực hiện

- Mỗi lượt chỉ nhận một task ID; đọc các tài liệu bắt buộc tại `source/.ai/README.md`.
- Một task tối đa khoảng 5 file; không làm task phụ ngoài dependency.
- Đánh dấu `progress.md` và checklist task `[x]` sau khi tiêu chí hoàn tất/test pass.
- Mọi file đích thuộc cây ở `stucture/project-structure.md`; template import phải được mở/đọc ở phase 4 và 8.

## Thứ tự phase và dependency

| Phase | Nội dung | Phụ thuộc |
|---|---|---|
| 01 | Setup & scaffolding | — |
| 02 | SQLite + REST API cơ bản | Phase 01 |
| 03 | Layout, Navbar, component dùng chung | Phase 01; API contract Phase 02 |
| 04 | Import topic HTML end-to-end | Phase 02–03 |
| 05 | Trang chủ | Phase 02–03 |
| 06 | Học từ, phát âm, flashcard | Phase 02–03 |
| 07 | Progress + collections | Phase 02, 06 |
| 08 | Quiz import + làm bài + kết quả | Phase 02–03; template quiz; import utilities Phase 04 có thể dùng chung |
| 09 | Profile + statistics | Phase 02, 07–08 |
| 10 | Polish, a11y, fidelity, README | Phase 04–09 |

Phase 4 và 5/6 có thể bắt đầu song song khi dependency chung hoàn tất, nhưng nên xong import topic trước để dùng dữ liệu thật. Phase 8 tái sử dụng media/upload và transaction pattern, không gộp quiz parser vào topic parser.

## Definition of Done mỗi task

1. Đúng spec/paths và không có code ngoài scope.
2. Typecheck/lint/test tương ứng pass; nếu chưa có test infrastructure thì task setup phải tạo trước.
3. UI có loading/empty/error phù hợp và keyboard/accessibility cơ bản.
4. API response/error theo envelope; SQL parameterized.
5. Import giữ fidelity, không execute HTML JS, không để lại file rác.

## Ma trận F-feature → task

| Feature | Task phủ chính |
|---|---|
| F-01 Trang chủ | P05-T01, P05-T02, P10-T01 |
| F-02 Navbar/search | P03-T02, P03-T03, P10-T01 |
| F-03 Topic word list | P06-T01, P06-T02 |
| F-04 Flashcard/pronunciation | P06-T03, P06-T04 |
| F-05 Progress/resume | P07-T01, P07-T02 |
| F-06 Collections | P07-T03, P07-T04 |
| F-07 Topic import/delete | P04-T01–P04-T07 |
| F-08 Quiz import/admin | P08-T01–P08-T04 |
| F-09 Quiz run/result/history | P08-T05–P08-T07 |
| F-10 Profile/goals | P09-T01 |
| F-11 Statistics | P09-T02, P09-T03 |
| F-12 Responsive/a11y/system states | P10-T01–P10-T03 |

## Gating khi triển khai import

- Trước P04: mở `source/.ai/content/template/fruits.html` và đọc toàn file; đối chiếu `source/.ai/spec/html-import.md`.
- Trước P08: mở `source/.ai/quiz/template/fruits_quiz.html` và đọc toàn file; đối chiếu `source/.ai/spec/html-import.md`.
- Nếu template đổi, dừng implementation liên quan, cập nhật html-import/data-api/UI/spec/test fixture trước khi tiếp tục.
