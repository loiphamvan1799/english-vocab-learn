# Phase 06 — Học từ vựng

## P06-T01 — Topic detail và word list

**Mục tiêu:** Tạo trang học theo topic, metadata và list từ theo thứ tự import; chuẩn bị mode switch.

**File cần tạo/sửa:** `source/client/app/topics/[topicId]/page.tsx`, `source/client/features/topics/topic-types.ts`, `source/client/features/topics/topics-api.ts`.

**Spec liên quan:** F-03; `ui-design.md` (topic detail wireframe); `data-and-api.md` (GET topic detail).

**Các bước làm:**
1. Fetch topic + words + progress từ API; map 404/not found.
2. Render title/category/level/lang/description/count, không tạo POS/IPA/audio thiếu.
3. Render empty/error/loading states và chọn mode list/flashcard.
4. Bảo đảm order import được giữ; lưu selection URL/local state đơn giản.

**Tiêu chí hoàn thành:**
- [ ] Metadata và danh sách hiện đúng theo nguồn.
- [ ] 404 có điều hướng về topic list/home.
- [ ] List/flashcard mode control hoạt động.
- [ ] Không hardcode dữ liệu demo.

**Phụ thuộc:** P02-T03, P03-T01–P03-T03, P04-T03.

## P06-T02 — Word card và highlight

**Mục tiêu:** Hiển thị đầy đủ trường template trên card, với highlight `[[...]]` an toàn và thao tác học/lưu.

**File cần tạo/sửa:** `source/client/components/topics/word-card.tsx`, `source/client/lib/highlighted-example.tsx`.

**Spec liên quan:** F-03, F-05, F-06; `ui-design.md` (WordCard); `html-import.md` (literal text/highlight).

**Các bước làm:**
1. Render image/nameVi/chunk/IPA/meaningVi/example EN/VI.
2. Tokenize `[[...]]` thành text + `<mark>`; không parse arbitrary markup.
3. Thêm alt/fallback image và wrap cho nội dung dài.
4. Expose callback mark mastered/save collection, không nhúng fetch vào card.

**Tiêu chí hoàn thành:**
- [ ] Tất cả source fields hiển thị, không bị cắt mất.
- [ ] XSS payload được render text, không executable.
- [ ] Ảnh lỗi chuyển fallback có alt phù hợp.
- [ ] Card keyboard accessible và focus rõ.

**Phụ thuộc:** P06-T01, P03-T01.

## P06-T03 — Pronunciation controls

**Mục tiêu:** Phát audio import nếu có, nếu không dùng Web Speech API fallback en-US, tránh song song nhiều lượt đọc.

**File cần tạo/sửa:** `source/client/components/topics/pronounce-button.tsx`, `source/client/features/topics/use-speech-synthesis.ts`.

**Spec liên quan:** F-04; `ui-design.md` (PronounceButton); `features.md` F-04.

**Các bước làm:**
1. Đọc data contract để phân biệt audio URL, accent variants và null.
2. Dừng utterance trước khi phát mới; gọi audio element trước fallback.
3. Fallback `SpeechSynthesisUtterance` locale en-US khi source audio absent.
4. Nút UK/US chỉ dùng source accent-specific nếu có; nếu không, mô tả fallback trung thực.
5. Xử lý unsupported API/error/voices và reduced-motion.

**Tiêu chí hoàn thành:**
- [ ] Imported audio ưu tiên hơn TTS.
- [ ] Template hiện tại phát chunk fallback `en-US`.
- [ ] Không đọc IPA hoặc gán accent không có nguồn.
- [ ] Speaker button có aria-label/playing state.

**Phụ thuộc:** P06-T02, P02-T01.

## P06-T04 — Flashcard mode

**Mục tiêu:** Tạo học từng từ với flip card, trước/sau và mastered action, lưu vị trí chuyển từ.

**File cần tạo/sửa:** `source/client/components/topics/flashcard.tsx`, `source/client/features/topics/flashcard-controls.ts`.

**Spec liên quan:** F-04, F-05; `ui-design.md` (Flashcard); `features.md` F-03–F-05.

**Các bước làm:**
1. Mặt trước hiển thị chunk/image; mặt sau meaning/IPA/examples.
2. Thêm flip button và keyboard controls; respect reduced motion.
3. Nút trước/sau giữ position, disabled ở biên theo một policy konsistent (wrap-around không bật mặc định).
4. Mark mastered callback và persist current position qua API.
5. Chuyển mode list/flashcard không reset position.

**Tiêu chí hoàn thành:**
- [ ] Nội dung mặt trước/sau đầy đủ, animation chỉ khi motion được phép.
- [ ] Trước/Sau và position đúng thứ tự.
- [ ] Mastered và current position được persist.
- [ ] Keyboard-only usable.

**Phụ thuộc:** P06-T01–P06-T03, P07-T01.
