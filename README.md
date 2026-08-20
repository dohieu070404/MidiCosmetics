# Midi Cosmetics

Website catalog mỹ phẩm và khu vực quản trị cho Midi Cosmetics. Bản cập nhật này dùng bố cục editorial mềm, ấm và tinh gọn; tham khảo cách tổ chức nội dung của các thương hiệu làm đẹp cao cấp nhưng giữ nhận diện MIDI riêng.

## Điểm chính

- Header hai tầng trên desktop, menu mobile dạng drawer, không có banner miễn phí vận chuyển.
- Hero art-directed: desktop chọn từng câu chuyện; mobile crop riêng và giữ–kéo ngang để đổi ảnh.
- Logo MIDI thật được dùng xuyên suốt; menu mobile có nền kem đặc để nội dung luôn dễ đọc.
- Catalog chia 5 nhóm và 38 danh mục đúng theo file mẫu 441 sản phẩm; Chống nắng nằm trong Chăm sóc da, Kem đánh răng nằm trong Cơ thể & tóc, còn Nước hoa và Phụ kiện là hai nhóm riêng.
- Typography cân lại cho dễ đọc, các khối bo góc nhẹ, ảnh sản phẩm phủ kín khung và có reveal/hover motion mềm.
- Bộ ảnh editorial WebP mới cho các nhóm chính, trong đó có khối chăm sóc da riêng trên trang chủ.
- Catalog, trang sản phẩm, collections, blog, giới thiệu và liên hệ.
- Giỏ hàng khách lưu trong trình duyệt, không yêu cầu tài khoản công khai.
- Tạo phiếu yêu cầu/báo giá có CAPTCHA, link công khai, sao chép/chia sẻ và mở Messenger.
- Máy chủ kiểm tra lại trạng thái, tồn kho và giá trước khi tạo phiếu. Phiếu không phải hóa đơn tài chính.
- Admin quản lý sản phẩm, taxonomy, collections, media, báo giá, trang chủ, blog, import, email, nhật ký, cài đặt và phân tích mức quan tâm.
- Editor trang chủ trong admin dùng đúng 5 khối của giao diện public hiện tại: hero 4 danh mục, sản phẩm được quan tâm, editorial nước hoa, editorial skincare và Tạp chí Midi.
- UI section cũ được ẩn khỏi editor/public nhưng bản ghi vẫn được giữ; trước mỗi lần lưu, backend tạo snapshot `homepage.sections.backup` trong cùng transaction.
- Admin có thể lưu trữ hàng loạt phiếu spam, dọn phiếu chưa mở Messenger và khôi phục khi cần; phiếu `PROCESSED` luôn được bảo vệ.
- Giao diện có hover, transition, drawer animation và hỗ trợ `prefers-reduced-motion`.

## Công nghệ

- Frontend: React 19, Vite, React Router, Tailwind CSS, Zustand, Axios, Zod, Framer Motion.
- Backend: Node.js, Express, Prisma, PostgreSQL (Supabase tương thích), Zod.
- Source chỉ dùng JavaScript/JSX, không dùng TypeScript.

## Cấu trúc

```text
MidiCosmetics/
├── frontend/             React/Vite public site và admin UI
├── backend/              Express API, Prisma schema và migrations
├── docker-compose.yml    Chạy PostgreSQL + backend + frontend
├── scripts/              Tạo secret local và quét rò rỉ trước khi push
├── SECURITY.md           Checklist bảo mật và xử lý khi lộ credential
├── LOCAL-SETUP.md        Lệnh chạy/xử lý lỗi Docker trên Windows
└── README.md
```

## Chạy toàn bộ local bằng Docker

Chỉ cần Docker Desktop đang chạy. Trước lần chạy đầu, tạo file secret local bị Git ignore:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-local.ps1
docker compose up -d --build
docker compose ps
```

- Website: `http://localhost:8081`
- API qua Nginx: `http://localhost:8081/api/v1`
- Health qua Nginx: `http://localhost:8081/health`
- PostgreSQL: chỉ mở trong mạng Docker nội bộ, không chiếm cổng `5432` của máy
- Admin: `http://localhost:8081/quan-tri-midi-secure-2026`

Lần đầu backend sẽ chờ PostgreSQL sẵn sàng, chạy Prisma migrations và seed taxonomy/nội dung mẫu. Seed không tạo hoặc đổi bất kỳ tài khoản admin nào. Migration bảo mật sẽ xóa tài khoản mẫu cũ sau khi chuyển bài viết sang admin thật; nếu database local chưa có admin thật, tài khoản mẫu chỉ được vô hiệu hóa để không làm mất nội dung liên kết.

Tài khoản quản trị thật đang có trong Supabase được giữ nguyên. Database Docker local là một database riêng nên không tự có tài khoản Supabase.

Xem log nếu một service chưa healthy:

```bash
docker compose logs --tail=200 database backend frontend
```

`docker-compose.yml` chỉ đọc secret local từ `.env.docker.local`; file `.env` cũ chứa cấu hình Supabase/Cloudinary không được Compose dùng. Backend và PostgreSQL không publish cổng host, còn frontend chỉ bind `127.0.0.1:8081`, nên không lộ service local ra mạng LAN và không xung đột cổng 8080 trên Windows. Không commit `.env`, `.env.docker.local` hoặc bất kỳ file credential nào.

Khi chỉ cập nhật source hoặc giao diện, dùng `docker compose down` rồi `docker compose up -d --build`; không thêm `-v`. Cờ `-v` xóa volume PostgreSQL và uploads local nên chỉ dùng khi chủ động muốn làm lại toàn bộ dữ liệu.

Hướng dẫn chi tiết và checklist thay Supabase, Cloudinary, Messenger, SMTP thật nằm trong [LOCAL-SETUP.md](LOCAL-SETUP.md).

## Database

`backend/prisma/migrations/` là nguồn thay đổi schema. Trên production chạy migrations trong một release job riêng:

```bash
cd backend
npm ci
npm run prisma:generate
npm run prisma:deploy
```

Migration mới thêm collections SEO/cover, báo giá, dòng sản phẩm trong báo giá, sự kiện quan tâm và dọn tài khoản admin mẫu cũ theo cơ chế bảo toàn bài viết. Migration chỉ có hiệu lực trên Supabase sau khi release job chạy thành công; không bật migration tự động trong runtime.

## Kiểm tra trước khi phát hành

```bash
node scripts/security-audit.mjs --history

cd frontend
npm ci
npm audit --omit=dev --audit-level=high
npm run lint
npm run build

cd ../backend
npm ci
npm audit --omit=dev --audit-level=high
npx prisma validate
npm run prisma:generate
```

Không đưa `node_modules`, `.git`, file `.env`, logs, cache hoặc uploads runtime vào gói source. Gói bàn giao có thể giữ `frontend/dist` đã build để preview nhanh; khi deploy vẫn nên build lại từ source.

## Luồng báo giá

Docker local hiện đặt `QUOTE_CAPTCHA_ENABLED=false` và `VITE_QUOTE_CAPTCHA_ENABLED=false` để tạm bỏ qua bước CAPTCHA. Khi triển khai thật, tạo Google reCAPTCHA v2 Checkbox, điền `RECAPTCHA_SECRET_KEY`, `RECAPTCHA_ALLOWED_HOSTNAMES`, `VITE_RECAPTCHA_SITE_KEY`, bật đồng thời hai cờ CAPTCHA rồi build lại. Production bắt buộc bật CAPTCHA.

1. Khách thêm sản phẩm vào giỏ lưu cục bộ.
2. Khi CAPTCHA được bật, khách hoàn thành Google reCAPTCHA v2; frontend chỉ gọi API tạo phiếu sau khi cửa sổ Messenger mở thành công.
3. Backend gửi token đến Google để xác minh và kiểm tra hostname, đồng thời luôn áp dụng khóa idempotency, giới hạn tần suất/ngày và xác minh sản phẩm, tồn kho, giá hiện tại.
4. Backend lưu snapshot ở trạng thái `MESSENGER_OPENED` và phát token công khai. Hash token dùng để tra cứu; một bản AES-GCM đã mã hóa được giữ để admin có quyền có thể sao chép lại link. Token thô không được lưu.
5. Admin cập nhật trạng thái `MESSENGER_OPENED`, `PROCESSED` hoặc `EXPIRED`; phiếu rác được chuyển vào kho lưu trữ mềm thay vì xóa cứng.

## Production

- Dùng hai JWT secret ngẫu nhiên khác nhau; không bật bootstrap vì tài khoản admin thật đã có trong Supabase.
- Whitelist `CORS_ORIGIN`; không dùng `*`.
- Đặt website sau CDN/WAF có rate limit và bot protection. CAPTCHA cùng giới hạn Nginx/Express giúp giảm spam ứng dụng nhưng không thay thế lớp chống DDoS ở biên mạng.
- Dùng Cloudinary hoặc object storage vì filesystem serverless không bền vững.
- Đặt `FRONTEND_URL`, `MESSENGER_URL`, SMTP và database URL trong môi trường deploy.
- Seed không còn tạo tài khoản admin; giữ runtime migration và bootstrap tắt trên production.
- Không có đăng ký/đăng nhập khách hàng; auth chỉ dành cho admin.

Các dòng cần thay khi đưa lên môi trường thật đã được ghi chú trong `.env.example` và `.env.production.example`. Không đặt secret thật trong source hoặc trong biến `VITE_*`.

Chi tiết biến môi trường nằm trong [backend/.env.example](backend/.env.example) và [frontend/.env.example](frontend/.env.example).
