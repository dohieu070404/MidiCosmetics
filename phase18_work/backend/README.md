# Midi Cosmetics Backend

Backend API for Midi Cosmetics.

## Run with Docker

From the project root:

```bash
cp .env.docker.example .env
docker compose down -v --remove-orphans
docker compose up --build
```

## Local URLs

- Frontend: http://localhost:8081
- Backend health: http://localhost:8080/health
- API health: http://localhost:8080/api/v1/health
- MySQL from host: localhost:3037

Inside Docker, backend connects to MySQL through `mysql:3306`. This is expected.

## Admin accounts

Development seed admin is created only when `NODE_ENV=development`, `SEED_DATABASE=true` and `ALLOW_ADMIN_SEED=true`.

| Role | Email | Password |
| --- | --- | --- |
| ADMIN | admin@midicosmetics.local | Admin@123456 |

Production must create the first admin with `POST /api/v1/admin/bootstrap`; do not seed a fixed production admin.

## Roles

The system uses admin-only management. Public users browse products/blog/about without login.

- `ADMIN`: manage posts, products, categories, brands, imports and settings.

Public registration is disabled.

## Product import

Product import is inside product management. Admin can choose manual entry or Excel import.

The import flow supports:

- Download sample file
- Preview rows
- Show row errors before importing
- Import only when the preview is valid
- Save import logs

## Docker notes

The Docker build uses Node 20.19.5 and npm with the public npm registry.

`package-lock.json` must not contain private/internal registry URLs.
