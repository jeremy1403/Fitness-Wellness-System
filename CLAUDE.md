# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Monorepo with a **Laravel 10 REST API** backend and a **Next.js 16 (App Router) + React 19** frontend for a fitness and wellness platform. Must satisfy **Web Service Technologies + MVC + ORM** requirements. Laravel is pure backend (REST API + ORM + Service/Repository/Strategy), Next.js is the frontend (App Router pages, forms, state management). Demo via Next.js calling API (Postman as backup).

## Modules

| # | Module | Scope |
|---|--------|-------|
| 1 | User & Authentication Management | Registration, login/logout, roles (admin/trainer/member), Sanctum tokens |
| 2 | Class / Program Management | CRUD fitness classes, manage schedules, assign trainers |
| 3 | Booking / Appointment System | Book/cancel class schedules, rule enforcement via Strategy Pattern |
| 4 | Payment / Membership / Report | Membership plans, subscriptions, payments, reporting |

## Entity Model

```
User ──1:N──> UserRole <──N:1── Role
User ──1:1──> Trainer
User ──1:N──> Booking
User ──1:N──> Membership
User ──1:N──> Payment

FitnessClass ──1:N──> ClassSchedule
Trainer ──1:N──> ClassSchedule
ClassSchedule ──1:N──> Booking

MembershipPlan ──1:N──> Membership
Membership ──1:N──> Payment
```

**Eloquent Models:** User, Role, UserRole, Trainer, FitnessClass, ClassSchedule, Booking, MembershipPlan, Membership, Payment

## Commands

### Backend (`cd backend`)

| Task | Command |
|------|---------|
| Install deps | `composer install` |
| Dev server | `php artisan serve` (localhost:8000) |
| Run all tests | `php artisan test` |
| Run single test | `php artisan test --filter=TestClassName` |
| Lint/format | `./vendor/bin/pint` |
| Migrations | `php artisan migrate` |
| Fresh migrate + seed | `php artisan migrate:fresh --seed` |

### Frontend (`cd frontend`)

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (localhost:3000) |
| Lint | `npm run lint` |
| Production build | `npm run build` |

## API Routes

All API routes are versioned under `/api/v1` in `routes/api.php`:

- `/api/v1/auth/*` — registration, login, logout, current user
- `/api/v1/classes/*` — CRUD for fitness classes and schedules
- `/api/v1/bookings/*` — create/cancel/list bookings
- `/api/v1/memberships/*` — membership plans, subscriptions, payments

Authentication: **Laravel Sanctum** (token-based). Next.js frontend at `localhost:3000`, backend at `localhost:8000`.

## Backend Architecture

```
backend/app/
├── Http/
│   ├── Controllers/Api/        # One controller per module
│   │   ├── AuthController
│   │   ├── FitnessClassController
│   │   ├── ClassScheduleController
│   │   ├── BookingController
│   │   ├── MembershipController
│   │   └── PaymentController
│   ├── Middleware/
│   │   ├── Authenticate
│   │   └── EnsureRole            # Role-based access
│   ├── Requests/                 # Form Request validation per module
│   │   ├── Auth/
│   │   ├── Booking/
│   │   ├── Classes/
│   │   └── Membership/
│   └── Resources/                # API Resources (JSON shape)
├── Models/                       # Eloquent ORM models (10 entities)
├── Repositories/
│   ├── Contracts/                # Repository interfaces
│   └── Eloquent/                 # Eloquent implementations
├── Services/                     # Business logic layer
├── Domain/
│   └── Booking/
│       ├── Policies/             # Strategy Pattern implementations
│       └── BookingStrategyFactory
└── Providers/                    # Service providers (bind interfaces)
```

**Layering:** Controller → Service → Repository → Model (Eloquent ORM).

## Design Patterns

### Strategy Pattern — Booking Rules

Used in Module 3 (Booking/Appointment). Booking rules vary by membership tier:

| Tier | Max bookings/day | Advance booking window | Online booking |
|------|-----------------|----------------------|----------------|
| Basic | 1 | 3 days ahead | Yes |
| Premium | 3 | 14 days ahead | Yes |
| Walk-in | — | — | No (blocked) |

Implementation:
- `BookingPolicy` — interface defining `canBook(User, ClassSchedule): bool` and validation rules
- `BasicBookingPolicy` / `PremiumBookingPolicy` / `WalkInPolicy` — concrete implementations
- `BookingStrategyFactory` — resolves the correct policy based on user's membership plan
- `BookingService` — calls factory to get policy, validates, then creates booking

Location: `app/Domain/Booking/Policies/` and `app/Domain/Booking/BookingStrategyFactory.php`

### Repository Pattern — ORM Isolation

Used across all modules. Separates business logic from ORM query details.

Key repositories:
- `BookingRepository` — `findByUser()`, `existsForSchedule()`, `create()`
- `ClassScheduleRepository` — `getAvailable()`, `findWithClass()`
- `MembershipRepository` — `getActiveForUser()`, `create()`
- `UserRepository`, `PaymentRepository`, etc.

Each has an interface in `Repositories/Contracts/` and an Eloquent implementation in `Repositories/Eloquent/`. Bindings registered in a service provider.

Services call repositories only — no direct Eloquent/query builder usage in controllers or services.

## Frontend Architecture (Next.js App Router)

```
frontend/
├── app/                          # File-system routing (App Router)
│   ├── (public)/                 # Auth pages
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (app)/                    # Authenticated app shell
│   │   ├── layout.tsx
│   │   ├── app/                  # Trainer/Member system (base path: /app)
│   │   └── admin/                # Admin system (base path: /admin)
│   ├── layout.tsx
│   ├── globals.css
│   └── page.tsx
├── components/
├── lib/
│   └── api/                      # API client layer (one file per module)
│       ├── http.ts               # Fetch wrapper with auth token
│       ├── auth.api.ts
│       ├── classes.api.ts
│       ├── bookings.api.ts
│       └── membership.api.ts
├── store/                        # State management
├── hooks/
├── types/
├── utils/
└── public/
```

**Module alignment** — each of the 4 modules maps 1:1 between frontend and backend:

| Module | Frontend | Backend Controller | API Prefix |
|--------|----------|--------------------|------------|
| Auth | `app/(public)/login/page.tsx`, `app/(public)/register/page.tsx`, `lib/api/auth.api.ts` | `AuthController` | `/api/v1/auth` |
| Classes | `app/(app)/app/classes/page.tsx`, `app/(app)/admin/classes/page.tsx`, `lib/api/classes.api.ts` | `FitnessClassController` | `/api/v1/classes` |
| Bookings | `app/(app)/app/bookings/page.tsx`, `app/(app)/admin/bookings/page.tsx`, `lib/api/bookings.api.ts` | `BookingController` | `/api/v1/bookings` |
| Membership | `app/(app)/app/membership/page.tsx`, `app/(app)/admin/memberships/page.tsx`, `lib/api/membership.api.ts` | `MembershipController` | `/api/v1/memberships` |

## MVP Information Architecture & Routing (Next.js App Router)

Two role-based UI systems are required:
- User system for `trainer` and `member`
- Admin system for `admin`

Routing uses the Next.js App Router with a public auth area and an authenticated app shell. Role gating happens in `middleware.ts` and the authenticated layout to redirect users into the correct system.

### App Router structure (MVP)

```
app/
  (public)/
    login/page.tsx
    register/page.tsx
    forgot-password/page.tsx
  (app)/
    layout.tsx                 # Authenticated shell, loads current user + role
    app/                       # Trainer/Member system (base path: /app)
      layout.tsx
      page.tsx                 # User Dashboard
      classes/page.tsx         # Browse classes
      schedules/page.tsx       # Class schedules
      bookings/page.tsx        # Book/cancel classes
      membership/page.tsx      # Plan + subscription
      payments/page.tsx        # Payment history
      profile/page.tsx         # Account/profile
    admin/                     # Admin system (base path: /admin)
      layout.tsx
      page.tsx                 # Admin Dashboard
      users/page.tsx           # User list + status
      roles/page.tsx           # Role assignment
      trainers/page.tsx        # Trainer records
      classes/page.tsx         # CRUD classes
      schedules/page.tsx       # CRUD schedules + trainer assignment
      bookings/page.tsx        # Booking oversight
      memberships/page.tsx     # Plan management
      payments/page.tsx        # Payment list
      reports/page.tsx         # Membership/payment reports
  middleware.ts                # Auth + role guard and redirects
```

### Trainer/Member MVP IA (by module)

| Module | Primary pages (routes) | Notes |
|--------|-------------------------|-------|
| 1. Auth & Roles | `/login`, `/register`, `/app/profile` | Role-based access enforced in middleware |
| 2. Classes/Programs | `/app/classes`, `/app/schedules` | Trainers see their assigned classes/schedules |
| 3. Booking | `/app/bookings` | Create/cancel bookings |
| 4. Membership/Payment | `/app/membership`, `/app/payments` | Plan selection + payment history |

### Admin MVP IA (by module)

| Module | Primary pages (routes) | Notes |
|--------|-------------------------|-------|
| 1. Auth & Roles | `/login`, `/admin/users`, `/admin/roles`, `/admin/trainers` | User management + role assignment |
| 2. Classes/Programs | `/admin/classes`, `/admin/schedules` | CRUD classes and trainer assignment |
| 3. Booking | `/admin/bookings` | Booking oversight |
| 4. Membership/Payment/Report | `/admin/memberships`, `/admin/payments`, `/admin/reports` | Plans, payments, reporting |

## Database

MySQL database named `fitness_wellness` (configured in `backend/.env`). Migrations in `backend/database/migrations/`. A `database/sql/init_dump.sql` is provided for submission.

## Testing

Backend uses PHPUnit with two suites defined in `backend/phpunit.xml`:
- `tests/Unit` — unit tests
- `tests/Feature` — feature/integration tests

Test environment uses in-memory cache, array mail driver, and sync queue (configured in phpunit.xml).
