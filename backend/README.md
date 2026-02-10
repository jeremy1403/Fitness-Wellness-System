# Fitness & Wellness Platform

Monorepo with a **Laravel 10 REST API** backend and a **Next.js 16 (App Router) + React 19** frontend.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | PHP 8.2, Laravel 10, Laravel Sanctum |
| Database | MySQL 8.0 |
| Cache/Queue | Redis 7 |
| Architecture | Controller → Service → Repository → Model (Eloquent ORM) |

## Quick Start (Docker)

From the **project root**:

```bash
# One-command setup: build all containers, install deps, migrate, seed
make init
```

Services will be available at:

| Service | URL |
|---------|-----|
| Frontend (Next.js) | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Mailpit (email UI) | http://localhost:8025 |

### Common Commands

| Task | Command |
|------|---------|
| Start all containers | `make up` |
| Stop all containers | `make down` |
| Rebuild all | `make build` |
| View logs | `make logs` or `make logs s=frontend` |
| **Backend** | |
| Run tests | `make test` |
| Run linter | `make lint` |
| Open shell | `make shell` |
| Run migrations | `make migrate` |
| Fresh migrate + seed | `make fresh` |
| MySQL CLI | `make mysql` |
| Dump database | `make dump` |
| **Frontend** | |
| Open shell | `make frontend-shell` |
| Rebuild container | `make frontend-build` |
| Run ESLint | `make frontend-lint` |
| Full list | `make help` |

## Local Development (without Docker)

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve   # http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_BASE_URL
npm run dev                        # http://localhost:3000
```

## API Endpoints

All routes are versioned under `/api/v1`. See `backend/routes/api.php` for the full list.

| Module | Prefix | Status |
|--------|--------|--------|
| Auth & Users | `/api/v1/auth` | Implemented |
| Fitness Classes | `/api/v1/classes` | Planned |
| Bookings | `/api/v1/bookings` | Planned |
| Memberships | `/api/v1/memberships` | Planned |

Health check: `GET /api/v1/health`

## Testing

```bash
# All tests (via Docker)
make test

# Single test class (local)
cd backend && php artisan test --filter=AuthEndpointsTest
```

## Project Structure

```
fitness-wellness/
├── backend/                  # Laravel 10 API
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   ├── Models/
│   │   ├── Repositories/
│   │   ├── Services/
│   │   └── Domain/
│   ├── docker/               # PHP, Nginx, Supervisor configs
│   └── Dockerfile
├── frontend/                 # Next.js 16 (App Router)
│   ├── app/                  # File-system routing
│   ├── components/
│   ├── lib/api/              # API client layer
│   └── Dockerfile
├── docker-compose.yml
├── Makefile
└── .env                      # Port mappings + DB credentials
```
