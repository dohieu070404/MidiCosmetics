# Midi Cosmetics — ReactJS Website

Website ReactJS cho thương hiệu **Midi Cosmetics**, gồm trang chủ, Blog, Catalog sản phẩm, trang Về chúng tôi, đăng nhập tài khoản và khu vực quản trị cơ bản.

## Công nghệ

- ReactJS với `.js/.jsx`
- Vite
- React Router DOM
- TailwindCSS
- shadcn/ui-style components
- Zustand
- Axios
- Zod
- Framer Motion
- Lucide React

Không dùng TypeScript trong source code.

## Chạy local

```bash
npm install
cp .env.example .env
npm run dev
```

Trên Windows CMD hoặc PowerShell:

```bat
copy .env.example .env
npm run dev
```

Mở trình duyệt:

```txt
http://localhost:5173
```

## Preview bản build có sẵn

Zip đã có sẵn thư mục `dist/`.

```bash
npm install
npm run preview
```

Mở:

```txt
http://localhost:4173
```

## Build lại

```bash
npm run build
```

## Lint

```bash
npm run lint
```

## Nội dung đã cập nhật

- Brand đổi thành Midi Cosmetics
- Navigation: Blog, Sản phẩm, Về chúng tôi
- Nút tài khoản là icon user và dẫn đến trang đăng nhập
- Theme toggle chỉ còn 2 chế độ: sáng và tối
- Footer có Facebook, Instagram, TikTok và số điện thoại
- Catalog có filter: Hair, Body, Skincare, Perfume, Mỹ phẩm, Phụ kiện
- Sản phẩm hiển thị tất cả mặc định khi vào tab Sản phẩm
- UI text đã chuyển sang tiếng Việt theo hướng khách hàng, không hiển thị nội dung kỹ thuật trên public site
- Font đã chuyển sang nhóm sans-serif hỗ trợ tiếng Việt tốt hơn

## Ảnh sản phẩm mẫu

Ảnh mẫu nằm tại:

```txt
public/images/products/
```

Dữ liệu sản phẩm nằm tại:

```txt
src/data/sample-products.js
```

## Cấu trúc chính

```txt
src/
├─ app/                 Layout, provider, router
├─ components/          Brand, common, layout, ui
├─ config/              Environment config
├─ constants/           Navigation, social links, API constants
├─ data/                Sample products
├─ hooks/               Shared hooks
├─ lib/                 Axios, motion, utils
├─ pages/               Public, auth, admin pages
└─ stores/              Zustand stores
```

---

# Phase 1 — Backend Foundation

Backend production-ready đã được thêm vào thư mục `backend/` và chạy cùng MySQL bằng Docker Compose.

## Chạy toàn bộ hệ thống bằng Docker

```bash
cp .env.docker.example .env
docker compose up --build
```

Sau khi containers chạy xong:

```txt
Frontend qua Nginx: http://localhost:8081
Backend API:        http://localhost:8080
Health check:       http://localhost:8080/health
API health:         http://localhost:8080/api/v1/health
```

Tài khoản admin seed mặc định chỉ dùng local khi `ALLOW_ADMIN_SEED=true`:

```txt
Email:    admin@midicosmetics.local
Password: Admin@123456
```

Trong production, không seed admin cố định. Tạo admin đầu tiên bằng `POST /api/v1/admin/bootstrap`, sau đó tắt `ADMIN_BOOTSTRAP_ENABLED=false`. Bắt buộc cấu hình `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD` mạnh trong `.env`.

## Chạy backend local không dùng Docker

Cần MySQL đang chạy và tạo database trước.

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

## API chuẩn

Success response:

```json
{
  "success": true,
  "message": "",
  "data": {},
  "meta": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "",
  "errors": []
}
```

## Endpoints Phase 1

```txt
GET  /health
GET  /api/v1/health
GET  /api/v1/health/live
GET  /api/v1/health/ready
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

Ví dụ login:

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@midicosmetics.local","password":"Admin@123456"}'
```

Ví dụ gọi `me`:

```bash
curl http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## Backend folder structure

```txt
backend/
├─ prisma/
│  ├─ migrations/20260513000000_init/migration.sql
│  ├─ schema.prisma
│  └─ seed.js
├─ src/
│  ├─ app.js
│  ├─ server.js
│  ├─ config/
│  │  ├─ cloudinary.js
│  │  ├─ cors.js
│  │  ├─ database.js
│  │  ├─ env.js
│  │  └─ logger.js
│  ├─ constants/
│  │  ├─ http-status.js
│  │  └─ roles.js
│  ├─ errors/
│  │  └─ api-error.js
│  ├─ middlewares/
│  │  ├─ authenticate.js
│  │  ├─ authorize.js
│  │  ├─ error-handler.js
│  │  ├─ not-found.js
│  │  ├─ rate-limiter.js
│  │  ├─ request-id.js
│  │  ├─ response.js
│  │  ├─ upload.js
│  │  └─ validate.js
│  ├─ modules/
│  │  ├─ auth/
│  │  │  ├─ auth.controller.js
│  │  │  ├─ auth.service.js
│  │  │  └─ auth.validation.js
│  │  ├─ health/
│  │  │  ├─ health.controller.js
│  │  │  └─ health.service.js
│  │  └─ users/
│  │     └─ user.repository.js
│  ├─ prisma/
│  │  └─ client.js
│  ├─ routes/
│  │  ├─ index.js
│  │  └─ v1/
│  │     ├─ auth.routes.js
│  │     ├─ health.routes.js
│  │     └─ index.js
│  ├─ scripts/
│  │  └─ healthcheck.js
│  ├─ utils/
│  │  ├─ api-response.js
│  │  ├─ async-handler.js
│  │  ├─ jwt.js
│  │  ├─ pagination.js
│  │  ├─ password.js
│  │  ├─ safe-json.js
│  │  └─ token-hash.js
│  └─ validators/
│     └─ common.schemas.js
├─ .dockerignore
├─ .env.example
├─ Dockerfile
├─ docker-entrypoint.sh
└─ package.json
```

## Những phần Phase 1 đã hoàn thiện

- Express app architecture tách `app.js` và `server.js` để dễ test/scale.
- Config architecture bằng Zod, validate biến môi trường ngay lúc boot.
- Logger Pino có request id và redact token/password.
- Error handling tập trung, map lỗi Prisma/JWT/Zod sang response chuẩn.
- Response formatter thống nhất `success/message/data/meta` và `success/message/errors`.
- Validation middleware dùng Zod.
- Middleware architecture gồm request id, response formatter, auth, authorize, validation, upload base, rate limit, not found, error handler.
- Security middlewares gồm Helmet, CORS allowlist, compression, HPP, rate limit global và auth-specific.
- Prisma schema theo snake_case, có indexes, timestamps, soft delete, full-text indexes cho blog/product search.
- Docker Compose có MySQL 8.4, backend Node 22, Nginx serve frontend `dist` và reverse proxy `/api`.
- Health check có DB readiness check.
- Base auth gồm JWT access/refresh token, refresh token rotation, logout revoke token, seed super admin.


## Docker Desktop quick start

```bash
cp .env.docker.example .env
docker compose down -v
docker compose up --build
```

Open:

```txt
Frontend/Nginx: http://localhost:8081
Backend API:    http://localhost:8080
Health check:   http://localhost:8080/health
MySQL host:     localhost:3037
```

Nếu Docker Desktop báo lỗi port MySQL hoặc backend không connect database, đọc `DOCKER_DESKTOP_TROUBLESHOOTING.md`.
