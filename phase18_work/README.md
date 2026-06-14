# Midi Cosmetics

Website giới thiệu mỹ phẩm/nước hoa, blog tư vấn và admin quản trị cho chủ shop.

## Deploy Vercel

Source hiện đã có cấu hình deploy fullstack lên Vercel:

- Frontend React/Vite trong `frontend/`.
- Backend Express/Prisma trong `backend/`.
- Vercel Function entrypoint: `api/index.js`.
- Vercel config: `vercel.json`.

Đọc hướng dẫn chính tại:

- `README_DEPLOY_VERCEL.md`
- `ENV_VERCEL_GUIDE.md`
- `ADMIN_BOOTSTRAP_GUIDE.md`
- `IMPORT_1000_PRODUCTS_GUIDE.md`
- `MAIL_SETUP_GUIDE.md`
- `GIT_PUSH_GUIDE.md`
- `TEST_REPORT.md`

## Local development

Backend:

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npm run dev
```

Frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Build frontend

```bash
npm run build --prefix frontend
```

## Vercel build

```bash
npm run vercel-build
```
