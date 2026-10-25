# Đặc tả import HTML

## 1. Nguồn format và giới hạn đã quan sát

Chỉ có hai template HTML được đọc làm nguồn sự thật:

- Chủ đề: `source/.ai/content/template/fruits.html`
- Quiz: `source/.ai/quiz/template/fruits_quiz.html`

Cả hai dùng metadata trong `<meta name="..." content="...">` và dữ liệu trong các hằng JavaScript `TOPIC_METADATA`/`VOCAB_DATA` hoặc `QUIZ_METADATA`/`QUIZ_DATA`. Nội dung list nằm trong literal JS và chỉ được render thành các `<article>` sau khi chạy script mẫu. Backend tuyệt đối không chạy script và không phụ thuộc DOM đã render. Template chủ đề hiện có 30 items theo `topic-count=30`; quiz có 30 items theo `quiz-count=30`. Chỉ loại quiz `fill-in-the-blank` được quan sát. Không có file audio, IPA UK/US riêng, loại từ, đáp án dạng lựa chọn hay trường `explanation` riêng trong hai template.

CSS liên kết (`style.css`, `quiz.css`) chỉ phục vụ trình bày mẫu, không phải nguồn dữ liệu.

## 2. Cấu trúc/chứng cứ HTML thật

Metadata chủ đề trích nguyên văn:

```html
<meta name="topic-id"       content="fruits-vn">
<meta name="topic-title"    content="Trái cây Việt Nam">
<meta name="topic-category" content="Vocabulary">
<meta name="topic-level"    content="Beginner">
<meta name="topic-count"    content="30">
<meta name="topic-lang"     content="en-US">
```

Dữ liệu vocabulary thật (một object trong `VOCAB_DATA`):

```js
{
  id: "mango",
  imageUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80",
  nameVi: "Xoài",
  chunk: "a ripe mango",
  ipa: "/ə raɪp ˈmæŋ.ɡoʊ/",
  meaningVi: "Một quả xoài chín",
  exampleEn: "This [[a ripe mango]] smells amazing.",
  exampleVi: "Quả xoài chín này thơm thật."
}
```

Các thẻ render trong template JS xác nhận cách hiển thị/quan hệ item: `<article class="vocab-item" data-id="..." data-index="...">`, ảnh `<img data-role="image" src="..." alt="...">`, và các `data-role` `chunk`, `name-vi`, `ipa`, `meaning-vi`, `example-en`, `example-vi`. Đây là HTML template thật được tạo bởi template script; parser không thực thi đoạn script để sinh DOM.

Metadata quiz trích nguyên văn:

```html
<meta name="quiz-id"        content="fruits-vn-quiz">
<meta name="quiz-topic-id"  content="fruits-vn">
<meta name="quiz-title"     content="Quiz Ôn Tập · Trái cây Việt Nam">
<meta name="quiz-type"      content="fill-in-the-blank">
<meta name="quiz-category"  content="Vocabulary">
<meta name="quiz-count"     content="30">
<meta name="quiz-lang"      content="en-US">
```

Dữ liệu quiz thật (một item rút đúng từ `QUIZ_DATA`):

```js
{ id:"mango", imageUrl:"https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80", nameVi:"Xoài", meaningVi:"Một quả xoài chín", chunk:"a ripe mango", exampleEn:"This [[a ripe mango]] smells amazing.", exampleVi:"Quả xoài chín này thơm thật." }
```

Markup render có `<article class="quiz-card" data-quiz-id="..." data-index="...">`, `<img data-role="image">` và các `data-role` `meaning-vi`, `name-vi`, `input`, `answer-reveal`, `chunk`, `example-reveal`. Đáp án được đưa vào `chunk`; `exampleEn` và `exampleVi` hiển thị sau nộp. Quiz type có ô nhập văn bản, không có lựa chọn multiple-choice.

## 3. Chiến lược parse, không thực thi mã

1. Đọc file UTF-8 với giới hạn kích thước; parse HTML bằng cheerio để lấy `<meta>`, `<title>` và `.page-header .page-desc`.
2. Tìm trong các inline `<script>` đúng declaration `const TOPIC_METADATA`, `const VOCAB_DATA` hoặc `const QUIZ_METADATA`, `const QUIZ_DATA` bằng parser cú pháp JavaScript (Acorn). Đọc AST literal `ObjectExpression`, `ArrayExpression`, chuỗi, số, boolean, null; không `eval`, `Function`, `vm` hoặc chạy script.
3. Chỉ chấp nhận literal object/array và các key tường minh thuộc schema. Từ chối spread, gọi hàm, identifier, computed key, duplicate key, biểu thức và declaration trùng/không duy nhất. Giới hạn kích thước script/độ sâu/số items để chống DoS.
4. Validate kết quả bằng Zod; giữ nguyên thứ tự mảng, ID và nội dung. `topic-count`/`quiz-count` là số khai báo để đối chiếu, số item thực tế của array là số import; mismatch tạo cảnh báo preview, không được âm thầm bỏ/thêm item.
5. Template `fruits.html` có `TOPIC_METADATA` trùng thông tin meta; phải đối chiếu hai nguồn. Nếu khác nhau thì báo lỗi mâu thuẫn, không tự chọn giá trị. Với `fruits_quiz.html`, đối chiếu metadata meta và `QUIZ_METADATA` tương tự.

### Selector/field → dữ liệu → DB

Các tên cột chi tiết nằm trong `data-and-api.md`; bảng này xác định mọi trường nguồn.

| Vùng | Nguồn HTML/literal | Trường chuẩn | Bắt buộc | DB |
|---|---|---|---|---|
| Topic meta | `meta[name=topic-id]` + `TOPIC_METADATA.id` | `topic.id` | Có | `topics.id` |
| Topic meta | `meta[name=topic-title]` + `TOPIC_METADATA.title` | `topic.title` | Có | `topics.title` |
| Topic meta | `topic-category`, `topic-level`, `topic-lang` | `category`, `level`, `lang` | Không | `topics.category/level/lang` |
| Topic meta | `topic-count` | `declaredCount` (chỉ đối chiếu) | Không | Không lưu; count tính từ `words` |
| Topic description | `.page-header .page-desc` | `description` | Không | `topics.description` |
| Word list | `VOCAB_DATA[]` thứ tự mảng | thứ tự từ | Có, ít nhất 1 | `words.position` |
| Word literal | `id` | `sourceId` | Có | `words.source_id` |
| Word literal | `nameVi`, `chunk`, `ipa`, `meaningVi` | tên VI, cụm, IPA, nghĩa | Có | Cột tương ứng `words` |
| Word literal | `exampleEn`, `exampleVi` | ví dụ EN/VI nguyên văn | Có | `words.example_en/example_vi` |
| Word literal | `imageUrl` | ảnh | Không | `words.image_url` + media metadata |
| Quiz meta | `quiz-id` + `QUIZ_METADATA.id` | `quiz.id` | Có | `quizzes.id` |
| Quiz meta | `quiz-topic-id` + `QUIZ_METADATA.topicId` | topic liên kết | Có | `quizzes.topic_id` |
| Quiz meta | `quiz-title`, `quiz-type`, `quiz-category`, `quiz-lang` | thuộc tính quiz | Có title/type; các field khác optional | `quizzes.*` |
| Quiz meta | `quiz-count` | `declaredCount` | Không, chỉ đối chiếu | Không lưu; count tính từ questions |
| Quiz list | `QUIZ_DATA[]` thứ tự mảng | thứ tự câu hỏi | Có, ít nhất 1 | `quiz_questions.position` |
| Quiz item | `id`, `imageUrl`, `nameVi`, `meaningVi`, `chunk`, `exampleEn`, `exampleVi` | payload question | Tất cả trừ image bắt buộc | `quiz_questions.*` |
| Generated markup | `data-role` và `data-index` | chỉ dẫn trình bày/index | Không parse từ markup | Không lưu; vị trí do array quyết định |

## 4. Nội dung, escaping và fidelity

- Chuỗi literal được decode theo cú pháp JavaScript bởi Acorn. Trim whitespace ở hai đầu chuỗi; không tự dịch, sửa chính tả, đổi chữ hoa/thường, chuẩn hóa dấu câu hoặc thay nội dung.
- Không dùng DOM text extraction cho literal để tránh HTML entity/markup tự làm biến đổi dữ liệu.
- Giữ `[[...]]` trong `exampleEn` như văn bản nguồn. UI tokenize cặp dấu này rồi render phần bên trong bằng `<mark>` an toàn; không render HTML từ input.
- Nếu nội dung markup trong field literal có ký tự `<b>`/`<em>`, đó là text, không phải HTML. Không parse/execute markup con. Nếu template tương lai chuyển thành markup dữ liệu, cần sửa spec và test trước khi triển khai.
- Ký tự đặc biệt (Unicode, dấu tiếng Việt, apostrophe, emoji) lưu UTF-8 nguyên dạng. Không gộp whitespace nội bộ nội dung import; whitespace ở đầu/cuối được trim. Khi kiểm tra câu trả lời quiz có thể trim và gộp whitespace để so khớp theo cách normalize của template, không sửa dữ liệu lưu.
- Không nhập CSS, script UI, theme toggle, nút thao tác, `<title>` presentation hay labels render sẵn thành dữ liệu vocab/quiz.

## 5. Media

### Các dạng cần hỗ trợ theo yêu cầu sản phẩm

| Dạng `imageUrl`/media ref | Cách xử lý | Kết quả |
|---|---|---|
| Relative path | Chỉ tìm trong các file companion upload cùng request. Chuẩn hóa separator; từ chối absolute path, `..`, symlink/realpath ra ngoài staging, và file không có trong upload. | Nếu tìm thấy, copy sang staging `uploads`; nếu thiếu, cảnh báo và giữ ref gốc không dùng làm local path. |
| URL `http:`/`https:` | Chỉ cho giao thức được phép; kiểm tra DNS/IP chống localhost/private/link-local và redirect; timeout, giới hạn byte/content type. | Tải được: lưu file local; lỗi: giữ URL ngoài và cảnh báo. Template hiện có URL Unsplash dạng này. |
| `data:image/...;base64,...` hoặc data URI audio | Chỉ MIME allowlist, decode base64 nghiêm ngặt, giới hạn kích thước và xác minh magic bytes. | Ghi file local; URI sai/không an toàn: cảnh báo hoặc lỗi nếu field bắt buộc theo policy. Không có data URI trong template hiện có. |
| Audio field | Template hiện tại không có audio property/tag/data URI. | Không tự tạo audio; lưu `audio_url` null. Future template có audio phải cập nhật mapping/schema fixture. |

- Tên file đích do server sinh: `<sha256-prefix>.<validated-extension>`; không tin filename do client gửi. Cùng bytes có thể reuse file đã tồn tại.
- Lưu `original_ref`, `resolved_url`, `storage_path`, MIME và trạng thái; phục vụ file local qua `/uploads/<generated-name>`.
- Với media external giữ URL khi download thất bại; CSP/referrer và UI phải xử lý nguồn ngoài an toàn. Ảnh thiếu dùng fallback UI `image-fallback` (gradient/emoji biểu tượng), không lưu fallback như ảnh import và không thay dữ liệu nguồn.
- Import transaction: ghi file vào staging; confirm kiểm tra DB trong transaction; nếu thất bại rollback và unlink file mới. Preview không tạo file vĩnh viễn; staging preview hết hạn được dọn.

## 6. Định danh, duplicate và quiz liên kết

- Topic identity lấy từ `topic-id`/`TOPIC_METADATA.id`, giữ nguyên nguồn; slug dùng để URL hóa chỉ là biểu diễn lowercase/kebab-case có kiểm tra collision, không thay ID gốc.
- Quiz identity lấy từ `quiz-id`/`QUIZ_METADATA.id`. Quan hệ chủ đề lấy `quiz-topic-id`/`QUIZ_METADATA.topicId`.
- Khi ID đã tồn tại, preview trả conflict options: `overwrite`, `create-copy`, `cancel`. Overwrite topic giữ progress của từ có cùng `(topic_id, source_id)`; từ mới progress mặc định, từ bị xóa không giữ tham chiếu mồ côi. Create-copy sinh ID mới có hậu tố phân biệt và không sửa ID nguồn của các question/word.
- Quiz overwrite giữ `quiz_id` và thay questions transactionally; quiz attempt cũ vẫn tồn tại, gắn quiz cùng ID và giữ snapshot payload/điểm để lịch sử không bị đổi ngầm.
- Quiz chỉ được import khi `topic_id` tồn tại hoặc người dùng chọn bỏ liên kết nếu UI/spec cho phép; lựa chọn mặc định đơn giản là yêu cầu topic đã tồn tại. Không thể suy ra giải thích riêng; dùng `exampleEn`/`exampleVi` như ngữ cảnh review, không bịa `explanation`.

## 7. Lỗi và cảnh báo hiển thị tiếng Việt

| Mã | Loại | Thông báo |
|---|---|---|
| `HTML_REQUIRED` | Lỗi | Vui lòng chọn một tệp HTML hợp lệ. |
| `UPLOAD_TOO_LARGE` | Lỗi | Tệp vượt quá dung lượng cho phép. Hãy chọn tệp nhỏ hơn. |
| `HTML_PARSE_FAILED` | Lỗi | Không đọc được cấu trúc HTML. Hãy kiểm tra tệp theo template. |
| `DATA_SCRIPT_MISSING` | Lỗi | Không tìm thấy khối dữ liệu cần thiết trong tệp HTML. |
| `DATA_SCRIPT_UNSAFE` | Lỗi | Khối dữ liệu chứa cú pháp không được hỗ trợ; không thể import an toàn. |
| `METADATA_MISSING` | Lỗi | Tệp đang thiếu mã định danh hoặc tên chủ đề/quiz. |
| `METADATA_CONFLICT` | Lỗi | Metadata trong HTML không khớp với dữ liệu nhúng. Hãy sửa tệp để hai phần giống nhau. |
| `ITEMS_EMPTY` | Lỗi | Tệp không có từ/câu hỏi để import. |
| `FIELD_MISSING` | Lỗi | Một mục đang thiếu trường bắt buộc: {field}. |
| `DUPLICATE_ITEM_ID` | Lỗi | Tệp có mã từ/câu hỏi bị trùng: {id}. |
| `COUNT_MISMATCH` | Cảnh báo | Số lượng khai báo ({declared}) khác số mục tìm thấy ({actual}); hệ thống sẽ giữ đúng số mục trong dữ liệu. |
| `MEDIA_NOT_FOUND` | Cảnh báo | Không tìm thấy tệp ảnh/âm thanh đi kèm: {ref}. |
| `MEDIA_DOWNLOAD_FAILED` | Cảnh báo | Không tải được media từ liên kết: {url}. Liên kết gốc sẽ được giữ lại. |
| `MEDIA_UNSAFE` | Lỗi | Đường dẫn hoặc loại tệp media không an toàn. |
| `QUIZ_TOPIC_NOT_FOUND` | Lỗi | Không tìm thấy chủ đề liên kết với quiz này. Hãy import chủ đề trước. |
| `QUIZ_TYPE_UNSUPPORTED` | Lỗi | Dạng quiz này chưa được hỗ trợ: {type}. |
| `ANSWER_NOT_IN_OPTIONS` | Không áp dụng | Template hiện tại là fill-in-the-blank, không có danh sách lựa chọn; không phát sinh kiểm tra này. Nếu loại câu hỏi mới có options, bổ sung schema/validator trước khi hỗ trợ. |
| `DUPLICATE_ENTITY` | Cảnh báo/luồng chọn | Chủ đề/quiz đã tồn tại. Chọn Ghi đè, Tạo bản mới hoặc Hủy. |

Trường bắt buộc thiếu hoặc lỗi cú pháp làm preview thất bại, không cho confirm. Thiếu ảnh là cảnh báo vì template có `imageUrl` nhưng UI có fallback; `imageUrl` vắng/null được cảnh báo, không bịa media. Audio không được cảnh báo là thiếu vì template hiện tại không định nghĩa trường audio.

## 8. Ví dụ end-to-end từ template thật

Nguồn là object Mango đã trích ở trên; parse output sau trim:

```json
{
  "topic": {
    "id": "fruits-vn",
    "title": "Trái cây Việt Nam",
    "category": "Vocabulary",
    "level": "Beginner",
    "lang": "en-US",
    "description": "Học từ vựng trực quan với hình ảnh thực tế chính xác từng loại quả, ghi nhớ tự nhiên qua các cụm từ (chunks) và câu ngữ cảnh thông dụng."
  },
  "words": [
    {
      "sourceId": "mango",
      "position": 1,
      "imageRef": "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80",
      "nameVi": "Xoài",
      "chunk": "a ripe mango",
      "ipa": "/ə raɪp ˈmæŋ.ɡoʊ/",
      "meaningVi": "Một quả xoài chín",
      "exampleEn": "This [[a ripe mango]] smells amazing.",
      "exampleVi": "Quả xoài chín này thơm thật."
    }
  ]
}
```

Bản ghi logic sau confirm (media local thành công hoặc giữ URL ngoài nếu tải lỗi): `topics(id='fruits-vn', title='Trái cây Việt Nam', category='Vocabulary', level='Beginner', lang='en-US', description=..., word_count=30)`; word ở vị trí 1 có `source_id='mango'`, `name_vi='Xoài'`, `chunk='a ripe mango'`, `ipa='/ə raɪp ˈmæŋ.ɡoʊ/'`, `meaning_vi='Một quả xoài chín'`, `example_en='This [[a ripe mango]] smells amazing.'`, `example_vi='Quả xoài chín này thơm thật.'`, `image_url` là `/uploads/<server-generated-file>` nếu được lưu hoặc URL gốc nếu download lỗi, `audio_url=NULL`. Đây là minh họa một word row từ array 30 items, không phải import một chủ đề chỉ có một từ.

## 9. Fidelity checklist

- [ ] IDs/title/meta đối chiếu meta tag và object metadata; mâu thuẫn bị chặn.
- [ ] Số item lưu bằng chính xác array length; declared count mismatch chỉ cảnh báo.
- [ ] Thứ tự array giữ nguyên qua preview, DB query `ORDER BY position`, UI.
- [ ] Mọi trường literal chủ đề/quiz được map; không thêm bản dịch, loại từ, IPA UK/US, lựa chọn hoặc explanation không có trong nguồn.
- [ ] Unicode, dấu câu, ký tự `[[...]]` và ví dụ được giữ nguyên sau trim biên.
- [ ] Ảnh gắn đúng item; URL/media path xử lý đúng policy; ảnh thiếu có cảnh báo/fallback.
- [ ] Audio chỉ ưu tiên nếu template tương lai khai báo audio; hiện tại audio template-null và phát âm client dùng SpeechSynthesis theo spec sản phẩm.
- [ ] Quiz `chunk` giữ bí mật khỏi màn hình câu hỏi; sau nộp hiện đáp án và example EN/VI; câu hỏi theo đúng thứ tự nguồn.
- [ ] Mọi lỗi giữa confirm rollback DB, xóa media mới; overwrite giữ đúng tiến độ/attempt history theo quy tắc.
- [ ] Parser test đọc trực tiếp cả `fruits.html` và `fruits_quiz.html`, kiểm tra counts và một số giá trị exact nêu trong fixture.
