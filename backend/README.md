# Midi Cosmetics API

Express + Prisma API cho catalog, blog, collections, media, giỏ khách/báo giá và quản trị Midi Cosmetics.

## Khởi động

Khuyên dùng Docker từ thư mục gốc để PostgreSQL, backend và frontend tự chạy cùng nhau:

```bash
./scripts/setup-local.sh
docker compose up -d --build
```

Nếu chạy riêng backend ngoài Docker, trước hết cần có PostgreSQL local ở `localhost:5432`, sau đó:

```bash
cp .env.example .env
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run dev
```

Khi chạy riêng backend, API mặc định là `http://localhost:8080/api/v1`. Khi chạy Docker Compose, truy cập qua frontend Nginx tại `http://localhost:8081/api/v1`; cổng backend không được publish ra host.

## Public API

- `GET /homepage`, `/about`, `/products`, `/products/:slug`
- `GET /collections`, `/collections/:slug`
- `GET /blogs`, `/blogs/:slug`, `/taxonomies`
- `POST /quotes`, `GET /quotes/:token`
- `POST /quotes/:token/messenger-opened`
- `POST /analytics/events`

Public không có đăng ký, đăng nhập hoặc tài khoản khách hàng.

## Admin API

Các route `/admin/*` yêu cầu access token admin. Bao gồm dashboard, sản phẩm, xuất kho Excel, xóa/khôi phục hàng loạt, taxonomy, collections, media, import, homepage, blog, báo giá, phân tích quan tâm, email logs, audit logs, notification recipients và profile.

Seed không tạo hoặc thay đổi admin. Tài khoản thật đã có trong Supabase nên giữ `ADMIN_BOOTSTRAP_ENABLED=false`.

## Lưu ý production

- PostgreSQL/Supabase; `DATABASE_URL` dùng runtime pooler, `DIRECT_URL` dùng migrations.
- Chạy `npm run prisma:deploy` trong release job, không tự migrate trong runtime.
- Dùng Cloudinary cho media trên môi trường không có persistent disk.
- Giữ JWT, database, SMTP và Cloudinary secrets ngoài source.
- Không có seed admin hoặc mật khẩu quản trị mặc định trong source.
- Đặt API sau CDN/WAF khi public; CAPTCHA và rate limiter của ứng dụng không thay thế chống DDoS ở tầng mạng.
