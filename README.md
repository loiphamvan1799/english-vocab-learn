# English Vocabulary — local study app

Ứng dụng local học từ vựng tiếng Anh với giao diện tiếng Việt.

## Yêu cầu

- Node.js 20 LTS trở lên, npm 10 trở lên.
- macOS/Windows/Linux; không cần tài khoản hay dịch vụ cloud.

## Cài đặt và chạy

```bash
npm install
npm run dev
```

Mặc định frontend chạy tại http://localhost:3000 và REST API tại http://localhost:4000. Cấu hình tùy chọn đặt trong `.env` theo `.env.example`; không đưa secret vào repository.

## Thêm nội dung

- Chọn **Thêm chủ đề**, upload HTML theo `source/.ai/content/template/fruits.html`, xem preview rồi xác nhận.
- Chọn **Thêm quiz**, upload HTML theo `source/.ai/quiz/template/fruits_quiz.html`, xem preview rồi xác nhận.
- Các template trên là format chuẩn duy nhất; quiz hiện hỗ trợ `fill-in-the-blank`.

## Deploy lên Vercel + Render

- Frontend Next.js: deploy trên Vercel. Thiết lập project root thành `source/client` hoặc dùng file [vercel.json](vercel.json) làm mốc config khi deploy từ repo gốc.
- Backend Express: deploy trên Render. Dùng file [render.yaml](render.yaml) để cấu hình service và biến môi trường `PORT`, `CLIENT_ORIGIN`, `ALLOWED_ORIGINS`.
- Biến môi trường cần thiết:
  - Vercel: `NEXT_PUBLIC_API_BASE_URL=https://your-render-api-url`
  - Render: `PORT=10000`, `CLIENT_ORIGIN=https://your-vercel-app.vercel.app`, `ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app`
- Không hardcode domain production trong code; toàn bộ domain phải đi qua biến môi trường.

## Dữ liệu và backup

- SQLite: `source/server/data/vocabulary.db`.
- Ảnh/audio import: `source/server/uploads/`, phục vụ nội bộ tại `/uploads`; cả DB và uploads không commit lên Git.
- Để backup đầy đủ, dừng ứng dụng rồi sao chép `vocabulary.db` cùng toàn bộ thư mục uploads sang nơi an toàn. Khi restore, đặt lại đúng hai vị trí trên.
- Không xóa database khi ứng dụng đang chạy; nếu dùng công cụ backup SQLite online, hãy tạo bản sao nhất quán trước khi di chuyển.
