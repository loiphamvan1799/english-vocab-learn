# Phase 01 — Setup & scaffolding

## P01-T01 — Khởi tạo npm workspaces

**Mục tiêu:** Thiết lập root npm workspaces và một lệnh `npm run dev` chạy đồng thời client/server. Khai báo scripts thống nhất, tối giản dependencies nền.

**File cần tạo/sửa:** `package.json`, `package-lock.json` (sinh bởi npm), `source/client/package.json`, `source/server/package.json`, `.gitignore`.

**Spec liên quan:** `project-structure.md`; `coding-rules.md` (Git/dependencies); F-12 (nền chạy local).

**Các bước làm:**
1. Khai báo npm workspaces `./source/client` và `./source/server`.
2. Tạo root scripts `dev` dùng concurrently, `build`, `lint`, `format`/`format:check` phù hợp packages.
3. Tạo package scripts riêng cho Next.js và server TypeScript.
4. Thêm concurrently và toolchain cần thiết đúng nơi; tạo lockfile bằng npm install.
5. Gitignore node_modules, .env*, *.db, uploads, staging, build outputs; giữ `.env.example` tracked.

**Tiêu chí hoàn thành:**
- [x] `npm install` thành công và lockfile khớp workspaces.
- [x] `npm run dev` gọi cả client và server đồng thời.
- [x] `node_modules`, `.env`, `*.db`, `source/server/uploads/` bị ignore.
- [x] Không thêm package UI/backend chưa cần.

**Phụ thuộc:** Không có.

## P01-T02 — Cấu hình TypeScript và lint

**Mục tiêu:** Bật TypeScript strict và quy tắc format/lint cơ bản cho hai workspace, nhất quán với coding rules.

**File cần tạo/sửa:** `.editorconfig`, `.prettierrc.json`, `source/client/tsconfig.json`, `source/client/eslint.config.mjs`, `source/server/tsconfig.json`.

**Spec liên quan:** `coding-rules.md` (TypeScript, naming, import order); `project-structure.md`.

**Các bước làm:**
1. Khai báo indent, charset UTF-8, LF, newline và trim trailing whitespace trong EditorConfig.
2. Cấu hình Prettier tối thiểu, không xung đột với ESLint.
3. Bật `strict` và Next.js types trong client.
4. Bật `strict`, Node types và build output tách biệt trong server.
5. Thêm lint scripts/flat config cần thiết, kiểm tra cấu hình rỗng compile được.

**Tiêu chí hoàn thành:**
- [x] Client/server typecheck pass trên scaffold.
- [x] ESLint không có lỗi cấu hình.
- [x] Formatter không đổi LF/encoding bất unexpected.
- [x] Không tắt strict hoặc lint rule tổng quát để che lỗi.

**Phụ thuộc:** P01-T01.

## P01-T03 — Tạo shell app và server

**Mục tiêu:** Tạo điểm khởi động rỗng, xác nhận Next.js và Express chạy độc lập/cùng root. Chỉ dựng shell, không triển khai tính năng nghiệp vụ.

**File cần tạo/sửa:** `source/client/next.config.ts`, `source/client/postcss.config.mjs`, `source/client/app/layout.tsx`, `source/client/app/globals.css`, `source/client/app/page.tsx`.

**Spec liên quan:** `ui-design.md` (font/tokens); `project-structure.md`; F-12 (app shell).

**Các bước làm:**
1. Cấu hình Next.js App Router và Tailwind/PostCSS theo versions đã chọn.
2. Tạo root layout semantic, metadata tiếng Việt, font Nunito qua `next/font` nếu build environment hỗ trợ.
3. Khai báo tokens nền/màu/type/radius trong globals, không hardcode token tại page.
4. Tạo trang placeholder đơn giản có title và trạng thái setup; không tạo dashboard feature.
5. Kiểm tra `npm run dev` hiển thị client.

**Tiêu chí hoàn thành:**
- [x] Next dev server khởi động không lỗi.
- [x] Globals có CSS tokens design-system ban đầu.
- [x] Không có API call hoặc tính năng ngoài task.
- [x] Trang có lang `vi`, heading semantic và responsive cơ bản.

**Phụ thuộc:** P01-T01, P01-T02.

## P01-T04 — Cấu hình server runtime và env

**Mục tiêu:** Khởi động Express TypeScript với cấu hình môi trường được validate; chuẩn bị cổng local và proxy client-server.

**File cần tạo/sửa:** `.env.example`, `source/server/src/index.ts`, `source/server/src/config/env.ts`.

**Spec liên quan:** `data-and-api.md` (ports/envelope); `coding-rules.md` (env/CORS); F-12.

**Các bước làm:**
1. Chọn port mặc định client 3000 và API 4000; ghi biến cần thiết vào `.env.example` không secret.
2. Validate env khi boot và trả lỗi rõ ràng nếu sai.
3. Tạo Express app tối thiểu với JSON limit, CORS origin local allowlist và endpoint health stub nếu cần.
4. Bắt signal shutdown nhẹ nhàng, không tạo service quản lý phức tạp.
5. Kiểm tra root `npm run dev` thấy cả hai process hoạt động.

**Tiêu chí hoàn thành:**
- [x] Server TypeScript chạy trên cổng mặc định/configured.
- [x] CORS không dùng wildcard.
- [x] Không hardcode secret.
- [x] Startup lỗi env báo nguyên nhân an toàn.

**Phụ thuộc:** P01-T01, P01-T02.
