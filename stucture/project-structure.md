# Cấu trúc dự án

> Cấu trúc ứng dụng hiện hành. File HTML trong `source/.ai/.../template/` là nguồn format import duy nhất.

```text
.
├── package.json                         # Root npm workspace, lệnh dev chung và scripts quản trị
├── package-lock.json                    # Khóa phiên bản dependencies của npm workspaces
├── .gitignore                           # Bỏ qua dependencies, env, database và uploads
├── .editorconfig                        # Quy tắc whitespace/newline thống nhất
├── .env.example                         # Ví dụ biến môi trường không chứa secret
├── README.md                            # Hướng dẫn chạy/backup duy nhất
├── stucture/
│   ├── project-structure.md             # Cây thư mục và luồng dữ liệu
│   └── coding-rules.md                  # Checklist quy tắc triển khai
└── source/
    ├── client/                          # Next.js App Router + TypeScript + Tailwind
    │   ├── package.json                 # Dependencies và scripts phía client
    │   ├── next.config.ts               # Cấu hình Next.js
    │   ├── tsconfig.json                # TypeScript strict cho client
    │   ├── eslint.config.mjs            # Quy tắc lint client
    │   ├── postcss.config.mjs           # Tích hợp Tailwind/PostCSS
    │   ├── app/
    │   │   ├── layout.tsx               # Root layout, font, metadata và providers tối thiểu
    │   │   ├── globals.css              # Tailwind và CSS design tokens
    │   │   ├── page.tsx                 # Trang chủ
    │   │   ├── topics/[topicId]/page.tsx # Học từ vựng của một chủ đề
    │   │   ├── topics/new/page.tsx      # Import chủ đề và preview
    │   │   ├── collections/page.tsx     # Bộ sưu tập
    │   │   ├── quizzes/page.tsx         # Danh sách quiz
    │   │   ├── quizzes/new/page.tsx     # Import quiz và preview
    │   │   ├── quizzes/[quizId]/page.tsx # Làm quiz
    │   │   ├── quizzes/[quizId]/result/page.tsx # Kết quả/review quiz
    │   │   ├── statistics/page.tsx      # Thống kê
    │   │   └── profile/page.tsx         # Hồ sơ và mục tiêu
    │   ├── components/
    │   │   ├── layout/                  # Navbar, TopicSwitcher và khung trang
    │   │   ├── ui/                      # Button, card, dialog, progress, skeleton
    │   │   ├── topics/                  # TopicCard, WordCard, Flashcard
    │   │   ├── import/                  # Dropzone, stepper và preview dùng chung
    │   │   └── quizzes/                 # QuizQuestion và kết quả/review
    │   ├── features/
    │   │   ├── topics/                  # Hooks, API client và types theo feature chủ đề
    │   │   ├── collections/             # Logic client bộ sưu tập
    │   │   ├── quizzes/                 # Logic client quiz
    │   │   ├── progress/                # Logic client tiến độ
    │   │   └── profile/                 # Logic client hồ sơ/thống kê
    │   ├── lib/
    │   │   ├── api-client.ts            # Wrapper fetch, parse response và lỗi API
    │   │   └── formatters.ts            # Format số liệu/ngày dùng chung
    │   └── public/                      # Chỉ asset tĩnh thuộc UI, không lưu upload người dùng
    ├── server/                          # Node.js + Express + TypeScript REST API
    │   ├── package.json                 # Dependencies và scripts phía server
    │   ├── tsconfig.json                # TypeScript strict cho server
    │   ├── src/
    │   │   ├── index.ts                 # Khởi tạo Express, middleware, routes và static uploads
    │   │   ├── config/env.ts             # Đọc/validate cấu hình môi trường
    │   │   ├── db/
    │   │   │   ├── connection.ts         # Mở SQLite và bật pragma cần thiết
    │   │   │   ├── migrate.ts            # Tạo/cập nhật schema phiên bản nhỏ gọn
    │   │   │   └── repositories/         # Truy vấn SQLite theo miền dữ liệu
    │   │   ├── middleware/               # Upload limits, validation, error handler
    │   │   ├── routes/                   # Khai báo endpoint; gọi service, không parse HTML
    │   │   ├── services/                 # Nghiệp vụ import, topic, quiz, progress, profile
    │   │   ├── import/
    │   │   │   ├── topic-parser.ts        # Cheerio metadata + Acorn literal parser chủ đề
    │   │   │   ├── quiz-parser.ts         # Cheerio metadata + Acorn literal parser quiz
    │   │   │   ├── media-resolver.ts      # Đọc media, tải/ghi file và cảnh báo
    │   │   │   └── schemas.ts             # Zod schemas cho dữ liệu parser/import
    │   │   ├── shared/                   # Response types, constants và helpers server
    │   │   └── tests/
    │   │       └── import/                # node:test cho parser, fixture từ template thật
    │   ├── data/
    │   │   └── vocabulary.db              # SQLite runtime; không commit
    │   └── uploads/                       # Media đã import; serve tại /uploads; không commit
    └── .ai/
        ├── README.md                      # Điểm vào bắt buộc cho AI coder
        ├── content/template/
        │   ├── fruits.html                # Template chủ đề hiện có; nguồn format chuẩn
        │   └── style.css                  # CSS hiển thị mẫu, không phải schema dữ liệu
        ├── quiz/template/
        │   ├── fruits_quiz.html           # Template quiz hiện có; nguồn format chuẩn
        │   └── quiz.css                   # CSS hiển thị mẫu, không phải schema dữ liệu
        ├── spec/
        │   ├── features.md                # Mã chức năng và acceptance criteria
        │   ├── data-and-api.md             # Schema SQLite và REST contract
        │   ├── html-import.md              # Quy tắc parse suy ra từ HTML thật
        │   └── ui-design.md                # Design tokens, components, wireframes
        └── plan-coding/
            ├── 00-overview.md              # Thứ tự phase và phụ thuộc
            ├── progress.md                 # Checklist tiến độ task
            └── phase-01-setup.md ...       # Mười phase triển khai
```

## File triển khai chính xác được plan sử dụng

Các file dưới đây nằm trong những thư mục đã thể hiện ở cây trên; danh sách này là phần mở rộng để mọi path task được xác định chính xác.

```text
.prettierrc.json
source/client/components/ui/{button,progress-bar,empty-state,error-state,skeleton,modal}.tsx
source/client/components/layout/{app-navbar,topic-switcher,page-container}.tsx
source/client/components/topics/{topic-card,word-card,pronounce-button,flashcard,collection-picker}.tsx
source/client/components/topics/delete-topic-button.tsx
source/client/components/import/{import-dropzone,import-preview,quiz-import-preview}.tsx
source/client/components/import/import-stepper.tsx
source/client/components/quizzes/{quiz-question,quiz-result-summary,quiz-review-list}.tsx
source/client/components/statistics/{study-chart,topic-progress-list}.tsx
source/client/features/topics/{topics-api,topic-types,dashboard-api,dashboard-types}.ts
source/client/features/collections/{collections-api,collection-types}.ts
source/client/features/quizzes/{quizzes-api,quiz-types,quiz-session,quiz-attempts-api}.ts
source/client/features/progress/{progress-api,use-word-progress,flashcard-controls}.ts
source/client/features/profile/statistics-api.ts
source/client/lib/{api-client,formatters}.ts
source/client/lib/highlighted-example.tsx
source/server/src/config/env.ts
source/server/src/db/{connection,migrate}.ts
source/server/src/db/repositories/{topics,words,media-assets,progress,collections,quizzes,quiz-attempts,profile,statistics}.ts
source/server/src/middleware/{error-handler,upload}.ts
source/server/src/routes/{topics,words,imports,progress,collections,quizzes,profile,statistics,dashboard}.ts
source/server/src/services/{topic-import-service,topics-service,quiz-import-service,progress-service,collections-service,dashboard-service,quiz-attempt-service,profile-service,statistics-service}.ts
source/server/src/import/{topic-parser,quiz-parser,media-resolver,schemas}.ts
source/server/src/shared/{api-response,constants,types}.ts
source/server/src/tests/import/{topic-parser,quiz-parser}.test.ts
source/server/{package.json,tsconfig.json}
source/client/{package.json,next.config.ts,tsconfig.json,eslint.config.mjs,postcss.config.mjs}
source/client/app/{layout.tsx,globals.css,page.tsx}
source/client/app/topics/{[topicId]/page.tsx,new/page.tsx}
source/client/app/collections/page.tsx
source/client/app/quizzes/{page.tsx,new/page.tsx,[quizId]/page.tsx,[quizId]/result/page.tsx}
source/client/app/{statistics,profile}/page.tsx
source/.ai/spec/{features,data-and-api,html-import,ui-design}.md
source/.ai/plan-coding/{00-overview,progress,phase-01-setup,phase-02-database-api,phase-03-layout-navigation,phase-04-topic-import,phase-05-home,phase-06-vocabulary-study,phase-07-progress-collections,phase-08-quizzes,phase-09-profile-statistics,phase-10-polish-release}.md
```

## Quy ước đặt file mới

- UI route đặt trong `source/client/app/`; component dùng chung ở `components/ui/`, component theo miền ở `components/<feature>/`.
- Logic client đặt trong `source/client/features/<feature>/`; không nhúng fetch/logic nghiệp vụ lớn trực tiếp vào page.
- Endpoint Express đặt trong `source/server/src/routes/`; nghiệp vụ ở `services/`, truy vấn SQL ở `db/repositories/`, parsing HTML riêng trong `import/`.
- Migration/schema thuộc `src/db/`; parser test thuộc `src/tests/import/` và dùng template HTML hiện có làm fixture, không tạo sample JSON.
- Upload runtime chỉ vào `source/server/uploads/`; SQLite runtime chỉ vào `source/server/data/`. Cả hai không được commit.
- Quy ước trên là layout mục tiêu. Tác vụ coding đầu tiên phải đối chiếu repository thực và chỉ di chuyển/tạo file trong phạm vi task đã được giao.

## Luồng dữ liệu

1. Client Next.js gọi REST API Express qua origin API local; request/response JSON dùng envelope `{ data, error }`.
2. Route kiểm tra input bằng Zod và gọi service; service dùng repository để đọc/ghi SQLite `better-sqlite3`.
3. Với import, client gửi HTML và các media đi kèm bằng multipart/form-data tới preview endpoint.
4. Import service parse HTML bằng cheerio, validate dữ liệu, resolve media và trả preview/cảnh báo; không render HTML nguồn.
5. Khi người dùng xác nhận, service lưu media theo staging, ghi DB trong transaction; nếu lỗi thì rollback DB và xóa staging/đích mới tạo.
6. Client nhận kết quả, điều hướng tới chủ đề/quiz; media local được phục vụ từ `/uploads/<safe-filename>`.
