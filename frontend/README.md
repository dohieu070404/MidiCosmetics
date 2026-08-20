# Midi Cosmetics Frontend

React/Vite frontend gồm public catalog và khu vực admin.

## Chạy local

```bash
cp .env.example .env
npm ci
npm run dev
```

## Kiểm tra

```bash
npm run lint
npm run build
npm run preview
```

## Public UX

- Editorial beauty layout, responsive header/menu, collections và blog.
- Hero desktop chuyển theo mục; mobile có crop riêng và giữ–kéo ngang để chuyển ảnh.
- Guest cart được lưu bằng Zustand persistence.
- Luồng tạo phiếu yêu cầu, link chia sẻ và Messenger; không có customer auth.

## Admin UX

Admin được bảo vệ tại `VITE_ADMIN_LOGIN_PATH`, sau đăng nhập đi tới `/admin/*`. Navigation chia theo tổng quan, catalog, phiếu yêu cầu, nội dung và dữ liệu/hệ thống.

Biến frontend đều có tiền tố `VITE_`. Không đặt database, JWT, SMTP hoặc secret khác trong frontend env.
