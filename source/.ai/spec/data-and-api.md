# Data model và REST API

## 1. Nguyên tắc dữ liệu

- SQLite một file: `source/server/data/vocabulary.db`; `better-sqlite3`, foreign keys bật, migrations có version.
- SQLite là nguồn dữ liệu chính; không dùng ORM. Mọi query có parameter binding, transaction cho overwrite/import.
- Tên DB dùng `snake_case`; thời gian lưu ISO-8601 UTC. ID import giữ đúng `topic-id`, `quiz-id` và item ID từ template; ID profile cố định `local`.
- Một người dùng local: không có auth/users table. Progress, collections, profile dùng duy nhất `user_id='local'` để giữ khóa ngoại rõ ràng.
- Trường nguồn chưa có trong template không được tự tạo giá trị. nullable `part_of_speech`, `ipa_uk`, `ipa_us`, audio là slot mở rộng theo product; template hiện có chỉ `ipa` và không có audio.
- HTML import fields chính xác: `topics.id/title/category/level/lang/description`; `words.source_id/position/image_url/name_vi/chunk/ipa/meaning_vi/example_en/example_vi`; quiz metadata `id/topic_id/title/type/category/lang`; `quiz_questions.source_id/position/image_url/name_vi/meaning_vi/chunk/example_en/example_vi`. Count khai báo đối chiếu, count thật tính từ hàng con.

## 2. Bảng SQLite

`PK` primary key, `FK` foreign key, `UQ` unique. Tất cả `TEXT` nullable chỉ khi ghi `NULL`.

### `topics`

| Cột | Kiểu | Ràng buộc/ý nghĩa |
|---|---|---|
| `id` | TEXT | PK; `topic-id` nguyên gốc từ template |
| `title` | TEXT | NOT NULL |
| `category` | TEXT | nullable; `topic-category` |
| `level` | TEXT | nullable; `topic-level` |
| `lang` | TEXT | nullable; `topic-lang`, ví dụ `en-US` |
| `description` | TEXT | nullable; `.page-header .page-desc` |
| `created_at`, `updated_at` | TEXT | NOT NULL ISO UTC |

`topic-count` không lưu thành sự thật thay cho row count; API tính `COUNT(words.id)`.

### `words`

| Cột | Kiểu | Ràng buộc/ý nghĩa |
|---|---|---|
| `id` | TEXT | PK UUID server-side |
| `topic_id` | TEXT | NOT NULL FK `topics(id)` ON DELETE CASCADE |
| `source_id` | TEXT | NOT NULL; ID item nguồn |
| `position` | INTEGER | NOT NULL, 1-based, giữ thứ tự array |
| `name_vi` | TEXT | NOT NULL; `nameVi` |
| `chunk` | TEXT | NOT NULL; cụm từ tiếng Anh |
| `part_of_speech` | TEXT | nullable; không có trong template hiện tại |
| `ipa` | TEXT | nullable; exact IPA hiện template |
| `ipa_uk`, `ipa_us` | TEXT | nullable; chỉ dùng khi template tương lai có dữ liệu tương ứng |
| `meaning_vi` | TEXT | NOT NULL |
| `image_url` | TEXT | nullable; local `/uploads/...` hoặc URL ngoài |
| `audio_url` | TEXT | nullable; audio chưa có trong template |
| `audio_uk_url`, `audio_us_url` | TEXT | nullable; mở rộng, không tự suy ra từ `ipa` |
| `example_en`, `example_vi` | TEXT | NOT NULL; giữ `[[...]]` nguyên gốc trong `example_en` |
| `created_at`, `updated_at` | TEXT | NOT NULL |

UQ (`topic_id`,`source_id`), UQ (`topic_id`,`position`).

### `media_assets`

| Cột | Kiểu | Ràng buộc/ý nghĩa |
|---|---|---|
| `id` | TEXT | PK UUID |
| `owner_type` | TEXT | NOT NULL: `word` hoặc `quiz_question` |
| `owner_id` | TEXT | NOT NULL; id bản ghi sở hữu |
| `media_kind` | TEXT | NOT NULL: `image`, `audio`, `image_uk`... |
| `original_ref` | TEXT | nullable; ref literal từ HTML |
| `resolved_url` | TEXT | nullable; URL ngoài nếu không tải được |
| `storage_path` | TEXT | nullable; tên tương đối do server sinh |
| `mime_type` | TEXT | nullable; loại đã kiểm chứng |
| `sha256` | TEXT | nullable; hash file |
| `created_at` | TEXT | NOT NULL |

Không cho path user-controlled; `words.image_url`/audio URL tương thích truy vấn thuận tiện và media_assets ghi nguồn/trạng thái.

### `quizzes`

| Cột | Kiểu | Ràng buộc/ý nghĩa |
|---|---|---|
| `id` | TEXT | PK; `quiz-id` nguồn |
| `topic_id` | TEXT | nullable FK `topics(id)` ON DELETE SET NULL; quiz import mặc định yêu cầu topic đã tồn tại |
| `title` | TEXT | NOT NULL |
| `type` | TEXT | NOT NULL; hiện `fill-in-the-blank` |
| `category`, `lang` | TEXT | nullable; metadata template |
| `created_at`, `updated_at` | TEXT | NOT NULL |

### `quiz_questions`

| Cột | Kiểu | Ràng buộc/ý nghĩa |
|---|---|---|
| `id` | TEXT | PK UUID server-side |
| `quiz_id` | TEXT | NOT NULL FK `quizzes(id)` ON DELETE CASCADE |
| `source_id` | TEXT | NOT NULL; ID item nguồn |
| `position` | INTEGER | NOT NULL, 1-based |
| `question_type` | TEXT | NOT NULL; hiện kế thừa `fill-in-the-blank` |
| `image_url` | TEXT | nullable; `imageUrl` |
| `name_vi`, `meaning_vi` | TEXT | NOT NULL; prompt/cue |
| `chunk` | TEXT | NOT NULL; đáp án đúng, không lộ trước submit |
| `example_en`, `example_vi` | TEXT | NOT NULL; ngữ cảnh/review sau submit; không có `explanation` riêng trong template |
| `created_at` | TEXT | NOT NULL |

UQ (`quiz_id`,`source_id`), UQ (`quiz_id`,`position`). Template hiện không có options; không tạo options giả.

### Progress, collection, profile và lịch sử

| Bảng | Cột quan trọng | Khóa/ràng buộc |
|---|---|---|
| `user_profile` | `user_id`, `name`, `avatar`, `daily_word_goal`, `updated_at` | PK `user_id`, chỉ row `local`; goal integer dương |
| `word_progress` | `user_id`, `word_id`, `is_mastered`, `first_studied_at`, `last_studied_at`, `updated_at` | PK (`user_id`,`word_id`); FK word cascade; chỉ tạo khi bắt đầu học |
| `topic_progress` | `user_id`, `topic_id`, `current_word_position`, `last_studied_at`, `updated_at` | PK (`user_id`,`topic_id`); FK topic cascade; status derive từ word progress |
| `collections` | `id`, `user_id`, `name`, `is_default`, `created_at`, `updated_at` | PK id; UQ (`user_id`,`name`); default “Yêu thích” được seed một lần |
| `collection_words` | `collection_id`, `word_id`, `created_at` | PK (`collection_id`,`word_id`); cả hai FK cascade |
| `study_log` | `id`, `user_id`, `word_id`, `studied_at`, `event_type` | PK id; FK word cascade; index ngày/user; event `view`/`mastered` |
| `quiz_attempts` | `id`, `user_id`, `quiz_id`, `score`, `total`, `percentage`, `answers_json`, `completed_at` | PK id; FK quiz `ON DELETE SET NULL`; answer snapshot giữ câu hỏi/đúng-sai để lịch sử sống qua re-import |

- Topic status tính: `Not started` khi chưa có word progress/study log; `In progress` khi có ít nhất một từ đã học nhưng chưa thuộc toàn bộ; `Completed` khi tổng số từ > 0 và tất cả mastered.
- Tổng từ đã học định nghĩa là số word có `first_studied_at`; streak tính chuỗi ngày lịch có `study_log`, theo timezone local của máy; mục tiêu hôm nay là số từ distinct học hôm nay so với profile goal.
- Khi xóa topic, word progress, topic progress, study log và collection links tới words cascade theo FK; quiz topic relation set null, attempts giữ snapshot. UI phải cảnh báo xóa.
- Khi overwrite topic, đồng bộ words trong transaction; giữ progress theo `source_id` của word trùng, xóa link/tiến độ cho word biến mất; positions cập nhật theo nguồn mới.

## 3. REST API

Base path `/api`; response envelope luôn `{ "data": ..., "error": null }` hoặc `{ "data": null, "error": { "code": "...", "message": "...", "details": ... } }`. `details` tùy chọn, không trả stack trace.

| Method + path | Request | Thành công | Lỗi chính |
|---|---|---|---|
| `GET /api/health` | — | `200 {data:{status}}` | `500` |
| `GET /api/dashboard` | — | `200` resume target, overview metrics, topic summaries | `500` |
| `GET /api/topics` | `?q=&status=` | `200` topic summaries, count/progress/status |
| `GET /api/topics/:topicId` | — | `200` topic + words theo position/progress |
| `DELETE /api/topics/:topicId` | — | `204` | `404`, `500`; thao tác media cleanup best effort |
| `GET /api/words/search` | `?q=&limit=` | `200` kết quả từ nhanh, giới hạn server |
| `PATCH /api/words/:wordId/progress` | `{isMastered:boolean}` | `200` trạng thái đã lưu |
| `PUT /api/topics/:topicId/progress` | `{currentWordPosition:integer}` | `200` vị trí học dở |
| `GET /api/collections` | — | `200` collections + count |
| `GET /api/collections/:collectionId/words` | — | `200` words theo thứ tự lưu/thứ tự chủ đề | `404` |
| `POST /api/collections` | `{name:string}` | `201` collection | `400`, `409` tên trùng |
| `PATCH /api/collections/:collectionId` | `{name:string}` | `200` | `400`, `404`, `409` |
| `DELETE /api/collections/:collectionId` | — | `204`; mặc định protected | `404`, `409` |
| `POST /api/collections/:collectionId/words` | `{wordId:string}` | `201` hoặc `200` nếu đã có | `404`, `409` |
| `DELETE /api/collections/:collectionId/words/:wordId` | — | `204` | `404` |
| `GET /api/quizzes` | `?topicId=` | `200` danh sách và question count |
| `GET /api/quizzes/:quizId` | — | `200` metadata + questions (không lộ chunk trong payload làm bài) |
| `DELETE /api/quizzes/:quizId` | — | `204`; attempts/snapshot được giữ | `404` |
| `POST /api/quizzes/:quizId/attempts` | `{answers:[{questionId,response}]}` | `201` score, percentage, review snapshot | `400`, `404`, `422` |
| `GET /api/quizzes/:quizId/attempts` | `?limit=` | `200` lịch sử điểm |
| `GET /api/profile` | — | `200` profile local |
| `PUT /api/profile` | `{name,avatar,dailyWordGoal}` | `200` profile đã validate |
| `GET /api/statistics` | `?range=7d\|30d` | `200` totals, daily series, topic progress, quiz history |
| `POST /api/imports/topics/preview` | multipart `html` + file fields `assets[]` | `200` preview, warnings, conflict, token/id tạm | `400`, `413`, `422` |
| `POST /api/imports/topics/confirm` | `{previewId, duplicateMode}`; mode overwrite/create-copy/cancel | `201` topic; `200` khi overwrite | `400`, `404` preview hết hạn, `409`, `422`, `500` |
| `POST /api/imports/quizzes/preview` | multipart `html` + `assets[]` | `200` preview, warnings, conflict, token/id tạm | `400`, `413`, `422` |
| `POST /api/imports/quizzes/confirm` | `{previewId, duplicateMode}` | `201` quiz; `200` overwrite | `400`, `404`, `409`, `422`, `500` |

Preview record sống ngắn trong staging, ràng buộc với payload/media đã validate; client chỉ nhận previewId opaque, không thể sửa parsed answer rồi confirm. `cancel` xóa staging. Không có endpoint edit câu quiz; re-import overwrite là cơ chế cập nhật.

## 4. Upload và file serving

- `multer` dùng memory/staging có giới hạn; chỉ HTML cho trường chính và allowlist media ảnh/audio. Giới hạn mặc định: HTML 2 MiB, từng media 10 MiB, tổng request 50 MiB; đưa thành constants/config dễ chỉnh.
- Tên lưu server-generated SHA-256 prefix + extension xác nhận bằng MIME/magic bytes, ví dụ `<hash>.jpg`; không dùng path gốc làm tên đích.
- Static route Express `/uploads` trỏ tới `source/server/uploads/`; chỉ serve file allowlist, không directory listing, header `X-Content-Type-Options: nosniff`.
- Local media URL: `/uploads/<generated-name>`; media external tải lỗi giữ nguyên URL; mọi hiển thị ảnh có alt text.
- DB file, `uploads/`, staging và `.env` phải gitignore. Backup: dừng app hoặc dùng SQLite online backup/API tương đương để copy DB nhất quán; backup cả uploads nếu cần media offline.
- Fallback ảnh: component hiển thị placeholder pastel/emoji, `alt` vẫn có tên từ; không gọi URL giả và không thay đổi trường import.
