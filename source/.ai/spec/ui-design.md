# Thiết kế giao diện

## 1. Hướng thiết kế và tokens

Nền trắng ấm, pastel dịu, khoảng trắng thoáng; card bo lớn, bóng nhẹ, nét chữ rõ. Không phụ thuộc emoji để truyền đạt trạng thái.

| Token | Giá trị đề xuất | Dùng cho |
|---|---|---|
| `--background` | `#FFFCFD` | Nền chính gần trắng |
| `--surface` | `#FFFFFF` | Card, dialog, navbar |
| `--foreground` | `#292633` | Text chính, contrast cao |
| `--muted-foreground` | `#625D6B` | Text phụ (đủ contrast trên trắng) |
| `--primary` | `#A34F78` | Button chính/link (tránh hồng nhạt làm text) |
| `--primary-soft` | `#F8E7EF` | Background badge/selection |
| `--lavender` | `#EEE9FB` | Accent phụ |
| `--mint` | `#E4F5EE` | Success/progress background |
| `--peach` | `#FFF0E6` | Callout phụ |
| `--success` | `#26734D` | Đúng/hoàn thành |
| `--warning` | `#855500` | Cảnh báo |
| `--danger` | `#A8324A` | Lỗi/sai |
| `--border` | `#E9E4EA` | Viền |
| `--focus` | `#6E50A1` | Focus ring |
| Font | Nunito qua `next/font/google`; sans fallback `Arial,sans-serif` | Font UI, hỗ trợ tiếng Việt |
| Radius | card `1.25rem`; control `0.75rem`; pill `9999px` | Card/nút/badge |
| Shadow | `0 8px 28px rgba(43,31,52,.07)` | Card; hover tăng rất nhẹ |
| Spacing | 4px base; 8/12/16/24/32/48px | Consistent padding/gap |
| Content width | max `1180px`; reading column `760px` | Trang nội dung |

Màu accent là decoration; text/button dùng foreground/primary đủ contrast. Map thành CSS custom properties và Tailwind theme; component không hardcode hex. Dark theme của template nguồn không phải yêu cầu app.

## 2. Component dùng chung và props

Props dưới đây là hợp đồng khái niệm; implementation type chốt theo task.

| Component | Props chính | Ghi chú |
|---|---|---|
| `AppNavbar` | `topics`, `activeTopicId`, `onSearch` | Links, search, mobile menu, CTA “Thêm chủ đề” |
| `TopicSwitcher` | `topics`, `activeTopicId`, `onSelect` | Dropdown searchable, active highlight và label |
| `PageContainer` | `title`, `description`, `actions`, `children` | Width/max spacing thống nhất |
| `TopicCard` | `topic`, `wordCount`, `masteredCount`, `status`, `imageUrl` | Progress/status không chỉ dựa màu |
| `ProgressBar` | `value`, `max`, `label`, `tone` | `aria-valuenow`, reduced-motion |
| `WordCard` | `word`, `isMastered`, `isCollected`, `onMaster`, `onCollect`, `onPronounce` | Hiển thị toàn bộ trường nguồn có |
| `PronounceButton` | `text`, `audioUrl?`, `accent?`, `fallbackLocale='en-US'`, `ariaLabel` | Imported audio luôn ưu tiên; fallback en-US |
| `Flashcard` | `word`, `isMastered`, `onMaster`, `onPrevious`, `onNext`, `canPrevious`, `canNext` | Lật thẻ, keyboard controls |
| `ImportStepper` | `currentStep: select\|preview\|complete` | 3 bước tiếng Việt |
| `ImportDropzone` | `accept`, `files`, `onFiles`, `onRemove`, `error?` | HTML + companion media selection |
| `ImportPreview` | `title`, `itemCount`, `items`, `warnings`, `errors`, `conflict?`, `onConfirm`, `onCancel` | Không hiển thị answer key thô ở quiz preview nếu policy cần tránh lộ; import preview cần xác thực số câu/field |
| `QuizQuestion` | `question`, `position`, `total`, `value`, `onChange`, `feedback?` | Render theo `fill-in-the-blank`; không giả lựa chọn |
| `QuizResultSummary` | `score`, `total`, `percentage`, `reviews`, `onRetry` | Summary và accessible review |
| `EmptyState` | `title`, `description`, `actionLabel`, `onAction` | Ví dụ chưa có topic → thêm chủ đề |
| `ErrorState` | `message`, `onRetry?` | Lỗi thân thiện, không lộ stack |
| `Skeleton` | `variant`, `count?` | Kích thước gần nội dung thật |

### Mọi trường template phải có nơi hiển thị

- Topic header/metadata: `topic.title`, `category`, `level`, `lang`, `description`; count là số item thực import, hiển thị cảnh báo riêng nếu metadata `topic-count` lệch.
- Word card/flashcard: `nameVi`, `chunk`, `ipa`, `meaningVi`, `imageUrl`, `exampleEn`, `exampleVi`; highlight đoạn trong `[[...]]` nhưng lưu/hiển thị nguyên nghĩa. `imageUrl` lỗi dùng fallback; media audio không có trong template hiện tại nên không hiện nguồn audio giả.
- Quiz preview/question/result: metadata `quiz.title`, `type`, `category`, `lang`, linked topic; mỗi câu hiển thị `imageUrl`, `nameVi`, `meaningVi`, input; sau submit hiện `chunk`, `exampleEn`, `exampleVi`. `id/position` được dùng nội bộ/đánh số. Không có options, IPA, audio hoặc explanation riêng trong template quiz.
- `part_of_speech`, IPA UK/US và audio UK/US là optional chỉ render khi nguồn có. Nút phát âm có thể dùng fallback SpeechSynthesis `en-US`; không trình bày nội dung phát sinh như dữ liệu import.

## 3. Wireframe theo trang

### Trang chủ `/`

```text
┌ Navbar: Logo | Trang chủ | Chủ đề ▾ | Bộ sưu tập | Quiz | Thống kê | Hồ sơ | [Tìm từ...] | + Thêm chủ đề ┐
├ Chào buổi học · mục tiêu hôm nay                         Streak 🔥 · x/y từ ┤
├ [Tiếp tục học: Topic · từ đang học · Tiếp tục]            [Tiến độ tổng quan] ┤
├ Các chủ đề                                                                    ┤
│ [TopicCard] [TopicCard] [TopicCard]                                            │
└ Empty state nếu chưa có topic: hướng dẫn + [Thêm chủ đề] ────────────────────┘
```

### Trang học `/topics/:topicId`

```text
Breadcrumb / Topic title + description + category/level/lang
[Danh sách] [Flashcard]                       Tiến độ mastered / total
┌ WordCard: ảnh | # | chunk + speaker | nameVi | IPA | meaningVi ┐
│ Ví dụ EN (highlight [[...]]), ví dụ VI · [Đã thuộc] [Lưu]       │
└────────────────────────────────────────────────────────────────┘
Flashcard mode: [Trước] [Card lật: chunk/ảnh ↔ nghĩa/IPA/examples] [Sau]
```

### Bộ sưu tập `/collections`

```text
Bộ sưu tập · [Tạo bộ sưu tập]
[Danh sách collection] | [Card từ đã lưu: chunk, nghĩa, topic, Bỏ lưu]
Empty collection → lời nhắc lưu từ vào “Yêu thích”
```

### Import chủ đề `/topics/new`

```text
Thêm chủ đề                         [1 Chọn file] — 2 Xem trước — 3 Hoàn tất
┌ Kéo HTML vào đây / [Chọn HTML] + [Chọn media đi kèm] ┐
│ Giới hạn dung lượng · template link                    │
└────────────────────────────────────────────────────────┘
Preview: title, category/level, số từ, cảnh báo count/media
[Danh sách rút gọn theo thứ tự: # · chunk · nameVi · image status]
[Hủy] [Ghi đè / Tạo bản mới nếu trùng] [Xác nhận tạo]
Success: thông báo + chuyển tới topic
```

### Quiz list `/quizzes`

```text
Quiz · Filter theo chủ đề · [+ Thêm quiz]
[Quiz card: title, topic, type, số câu, lần làm gần nhất/điểm] [Bắt đầu] [Xóa]
Empty → [Thêm quiz]
```

### Import quiz `/quizzes/new`

```text
Thêm quiz                           [1 Chọn file] — 2 Xem trước — 3 Hoàn tất
┌ Dropzone HTML + companion media                         ┐
Preview metadata: title · topic · type · số câu · warnings
[items rút gọn theo thứ tự: # · image · nameVi · meaningVi]
Conflict options: Ghi đè / Tạo bản mới / Hủy
[Hủy] [Xác nhận import]
```

### Làm quiz `/quizzes/:quizId`

```text
Quiz title · Câu 3/30 · ProgressBar
┌ Prompt image · nameVi · meaningVi ┐
│ [Input cụm từ tiếng Anh]           │
└────────────────────────────────────┘
[Trước]                                    [Tiếp] / [Nộp]
Sau submit: đúng/sai bằng icon + text; không chuyển đáp án sang câu khác ngoài thiết kế
```

### Kết quả `/quizzes/:quizId/result`

```text
Kết quả: score / total · percentage · summary
[Review từng câu: đúng/sai, response, answer, image, example EN + VI]
[Làm lại] [Danh sách quiz]
```

### Thống kê `/statistics`

```text
KPI: từ đã học | chủ đề hoàn thành | streak | mục tiêu hôm nay
[7 ngày | 30 ngày] [Chart + accessible data summary]
[Progress từng topic] [Lịch sử quiz/điểm]
```

### Hồ sơ `/profile`

```text
Hồ sơ local
Tên [input] · Avatar [emoji choices] · Mục tiêu từ/ngày [number]
[Lưu]
```

## 4. Responsive, interaction, trạng thái

- Mobile <640px: navbar collapse thành menu, cards một cột, controls lớn/touch target ≥44px, import actions full-width, quiz question một cột.
- Tablet 640–1023px: topic grid 2 cột, layout card linh hoạt; desktop ≥1024px 3 cột, content max-width 1180px.
- Hover card nâng 2–3px và shadow tăng nhẹ; button color/opacity transition 150–200ms; progress transition 300ms; flashcard 3D khoảng 350ms; quiz feedback scale/fade ngắn.
- `prefers-reduced-motion: reduce`: bỏ transform/3D/auto-scroll, transition gần như 0, nhưng giữ feedback bằng icon/text.
- Loading: skeleton tương ứng card/list/form. Empty: icon nhẹ, câu hướng dẫn, action. Error: tiếng Việt, retry nếu request có thể thử lại. Import stepper có trạng thái lỗi không chỉ dựa màu.
- Focus ring 2px có offset; tab order theo thứ tự thị giác; dialog duplicate trap/return focus; announcement cho upload progress và quiz result qua live region.
- Ảnh dùng `alt` mô tả tên từ (nếu không có alt trong nguồn thì dùng `nameVi`); avatar emoji có accessible label; button chỉ icon có `aria-label`.
