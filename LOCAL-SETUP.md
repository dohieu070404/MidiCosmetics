# Chạy Midi Cosmetics hoàn toàn local

## Khởi động nhanh

Yêu cầu duy nhất là Docker Desktop đang chạy.

### Windows CMD hoặc PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-local.ps1
docker compose up -d --build
docker compose ps
```

Mở `http://localhost:8081`. API ở `http://localhost:8081/api/v1` và health check ở `http://localhost:8081/health`; Nginx chuyển tiếp yêu cầu sang backend trong mạng Docker.

Ba container được tạo:

- `midi_database`: PostgreSQL local, dữ liệu giữ trong volume `postgres_data`.
- `midi_backend`: tự chờ database, chạy migrations và seed dữ liệu mẫu.
- `midi_frontend`: Nginx phục vụ giao diện và proxy `/api`, `/uploads` sang backend.

Không cần tạo `backend/.env` và không cần tài khoản Supabase hay Cloudinary. Script chỉ tạo `.env.docker.local` với mật khẩu PostgreSQL và hai JWT secret ngẫu nhiên; file này đã bị Git ignore.
PostgreSQL không publish cổng ra máy chủ nên không xung đột với PostgreSQL khác đang dùng cổng `5432`.
Backend cũng không publish cổng `8080` ra Windows, tránh lỗi `Ports are not available`. Chỉ frontend dùng cổng host `8081`.

## Tài khoản quản trị local

- URL: `http://localhost:8081/quan-tri-midi-secure-2026`
- Không có tài khoản hoặc mật khẩu mẫu trong source/seed.
- Tài khoản thật trong Supabase không tự xuất hiện ở PostgreSQL Docker local. Khi deploy với Supabase, đăng nhập bằng tài khoản thật đã lưu sẵn.
- Migration dọn tài khoản mẫu cũ chỉ xóa khi đã có admin thật để nhận các bài viết liên kết; nếu chưa có, tài khoản mẫu bị vô hiệu hóa và soft-delete để bảo toàn dữ liệu.

## Các lệnh thường dùng

```powershell
# Xem trạng thái
docker compose ps

# Xem log khi backend báo unhealthy
docker compose logs --tail=200 database backend

# Theo dõi log liên tục
docker compose logs -f backend

# Dừng nhưng giữ dữ liệu
docker compose down

# Build lại sau khi sửa source
docker compose up -d --build
```

Chỉ khi muốn xoá toàn bộ database và uploads local để làm lại từ đầu mới dùng:

```powershell
docker compose down -v
powershell -ExecutionPolicy Bypass -File scripts/setup-local.ps1 -Force
docker compose up -d --build
```

Lệnh `down -v` xoá dữ liệu local trong Docker volumes và không thể khôi phục nếu chưa backup.

## Cấu hình local an toàn

Compose không đọc secret từ source và không dùng `.env` cũ. Nó yêu cầu file `.env.docker.local`, được script tạo ngẫu nhiên và bị Git ignore. Frontend cố định bind vào `127.0.0.1:8081`; database/backend chỉ tồn tại trong mạng Docker.

Không dùng `-Force`/`--force` trừ khi muốn xoay toàn bộ credential local. Sau khi xoay mật khẩu PostgreSQL, volume database cũ vẫn giữ mật khẩu trước đó; khi đó cần chủ động `docker compose down -v` như cảnh báo ở trên.

## Thay dịch vụ thật sau này

Các mẫu dưới đây chỉ là placeholder. Đặt giá trị thật trong secret/environment của nền tảng deploy, không commit vào Git và không đưa vào biến frontend `VITE_*`.

### Supabase PostgreSQL

```dotenv
DATABASE_URL=postgresql://postgres.PROJECT_REF:URL_ENCODED_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.PROJECT_REF:URL_ENCODED_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
```

### Cloudinary

```dotenv
UPLOAD_DRIVER=cloudinary
CLOUDINARY_CLOUD_NAME=REPLACE_WITH_REAL_CLOUD_NAME
CLOUDINARY_API_KEY=REPLACE_WITH_REAL_API_KEY
CLOUDINARY_API_SECRET=REPLACE_WITH_NEW_ROTATED_API_SECRET
PUBLIC_UPLOAD_BASE_URL=
```

### Messenger

```dotenv
MESSENGER_URL=https://m.me/REPLACE_WITH_PAGE_ID
VITE_MESSENGER_URL=https://m.me/REPLACE_WITH_PAGE_ID
```

### SMTP

```dotenv
SMTP_HOST=REPLACE_WITH_SMTP_HOST
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=REPLACE_WITH_SMTP_USER
SMTP_PASS=REPLACE_WITH_SMTP_PASSWORD
MAIL_FROM=REPLACE_WITH_SENDER_EMAIL
ADMIN_ALERT_EMAIL=REPLACE_WITH_ADMIN_EMAIL
```

### Frontend và bảo mật production

```dotenv
NODE_ENV=production
CORS_ORIGIN=https://REPLACE_WITH_FRONTEND_DOMAIN
FRONTEND_URL=https://REPLACE_WITH_FRONTEND_DOMAIN
VITE_API_BASE_URL=https://REPLACE_WITH_BACKEND_DOMAIN/api/v1
VITE_API_ORIGIN=https://REPLACE_WITH_BACKEND_DOMAIN
JWT_ACCESS_SECRET=REPLACE_WITH_RANDOM_SECRET_AT_LEAST_48_CHARS
JWT_REFRESH_SECRET=REPLACE_WITH_RANDOM_SECRET_AT_LEAST_48_CHARS
RUN_MIGRATIONS=false
DATABASE_SYNC_STRATEGY=none
SEED_DATABASE=false
```

Migrations production nên chạy ở release job riêng, không tự chạy trong runtime serverless.

## CAPTCHA và chống spam phiếu yêu cầu

Google reCAPTCHA đang được tạm tắt trong Docker local bằng hai biến `QUOTE_CAPTCHA_ENABLED=false` và `VITE_QUOTE_CAPTCHA_ENABLED=false`. Giới hạn tần suất tại Nginx/Express, khóa `requestId` chống tạo trùng và giới hạn số phiếu theo phiên trong 24 giờ vẫn hoạt động.

Khi cấu hình lại, tạo khóa Google reCAPTCHA v2 Checkbox cho `localhost` và domain thật; điền `RECAPTCHA_SECRET_KEY`, `RECAPTCHA_ALLOWED_HOSTNAMES`, `VITE_RECAPTCHA_SITE_KEY`, đổi đồng thời hai cờ trên thành `true`, sau đó chạy `docker compose up -d --build`. Production bắt buộc bật reCAPTCHA và backend sẽ từ chối khởi động nếu thiếu secret hoặc hostname cho phép.

Trong admin, nút **Dọn phiếu chưa mở** và **Lưu trữ đã chọn** chỉ chuyển phiếu sang kho lưu trữ mềm. Phiếu đã xử lý không thể bị dọn hàng loạt và phiếu lưu trữ có thể khôi phục. Hệ thống không thể biết người dùng đã bấm nút **Gửi** bên trong Messenger nếu không tích hợp webhook/API của Meta; trạng thái hiện tại xác nhận được bước mở Messenger.

Khi public website, đặt Nginx sau CDN/WAF có rate limiting, bot management và giới hạn lưu lượng. Các giới hạn trong ứng dụng không thể tự chặn một cuộc DDoS bão hòa đường truyền.
