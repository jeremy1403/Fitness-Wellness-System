## Setup Core Infrastructure

我负责做 Module 1 — User & Access Management (Auth + Roles) 。目前，我要先完成 Backend (Laravel) 的部分。首先，你需要 Setup Core Infrastructure 。
1. Setup Basic Configuration
2. Setup Logger 方便所有 modules 使用
3. Database Connection to MySQL 方便之后可以使用 connection 操作数据库。

Always use the best practices for Laravel and coding. think hard and use context7


## Database Layer (Models → Migration → Repository)

我负责做 Module 1 — User & Access Management (Auth + Roles) 。目前，我要先完成 Backend (Laravel) 的部分。首先，你需要完成 Database Layer (Models → Migration → Repository) 。

references：
"""
1) User
id (PK)
name
email (unique)
password_hash（本地登录用）
status（active/disabled）
created_at
updated_at

2) Role
id (PK)
name（Admin/Staff/Member，unique）

3) UserRole (bridge)
id (PK)（或用 composite key 也行）
user_id (FK → User)
role_id (FK → Role)

4) Trainer
Trainer 建议和 User 做 1–1（trainer 是一种用户身份）
id (PK)
user_id (FK → User, unique)
specialty（例如 Yoga/HIIT）
status（active/inactive）

5) FitnessClass
id (PK)
title（class name）
description（可简短）
duration_minutes
status（active/inactive）

6) ClassSchedule
id (PK)
fitness_class_id (FK → FitnessClass)
trainer_id (FK → Trainer)
start_datetime
end_datetime
capacity
status（open/cancelled/completed）

7) Booking
id (PK)
user_id (FK → User)
class_schedule_id (FK → ClassSchedule)
status（booked/cancelled/attended/no_show）
booked_at
cancelled_at（nullable）

强烈建议加一个唯一约束：(user_id, class_schedule_id) 防止重复预约（也符合 secure/correctness）

8) MembershipPlan
id (PK)
name（Basic/Premium，unique）
price（decimal）
duration_days（例如 30 / 365）
booking_daily_limit（给 Strategy 用）
booking_advance_days（给 Strategy 用）
status（active/inactive）

9) Membership
id (PK)
user_id (FK → User)
membership_plan_id (FK → MembershipPlan)
start_date
end_date
status（active/expired/cancelled）

10) Payment
这里是“付款记录”，不做真实 gateway 也能拿分
id (PK)
membership_id (FK → Membership)
user_id (FK → User)（方便查历史）
amount（decimal）
method（cash/transfer/card_mock）
status（paid/failed/refunded）
paid_at
reference_no（unique，用于对账/展示）
"""

1. 根据上面我给的 references 来 Define Models 
2. 根据 Define 好的 Models 来 Create Migrations
3. 根据 Define 好的 Models 来 Build Repository

Always use the best practices for Laravel and coding. think hard and use context7


## Business Logic Layer (DTOs → Services → Validators)

我负责做 Module 1 — User & Access Management (Auth + Roles) 。目前，我要先完成 Backend (Laravel) 的部分。首先，你需要完成 Business Logic Layer (DTOs → Services → Validators) 。

references：
"""
Module 1 — User & Access Management (Auth + Roles)

Purpose: Manage user accounts and access control for Admin/Staff/Member.

Owned Entities:
User
Role
UserRole (bridge for many-to-many User↔Role)

Repository Usage:
UserRepository: findByEmail(), createUser(), updateProfile()
RoleRepository / UserRoleRepository: assignRole(), getUserRoles()
"""

1. Define DTOs
2. Create Services
3. Add Validators

For additional info:
1. 需要让 User 可以 login 和 register
2. 需要查看目前有多少 User 的 status 处于 "active", 多少 User 的 status 处于 "disabled"
3. 必须 加密 密码并存储到 数据库中。
4. User 的 email 必须是 unique 的。

Always use the best practices for Laravel and coding. think hard and use context7


## API Layer (Handlers → Routes)

我负责做 Module 1 — User & Access Management (Auth + Roles) 。目前，我要先完成 Backend (Laravel) 的部分。首先，你需要完成 API Layer (Handlers → Routes) 。

references: 
阅读现有的所有 Services ， Request 中的 Auth folder 中的所有文件，和 DTOs 中的 Auth folder 中的所有文件 

1. Create Handlers
2. Define Routes
3. Setup Router

Always use the best practices for Laravel and coding. think hard and use context7


## Application Entry Point

我负责做 Module 1 — User & Access Management (Auth + Roles) 。目前，我要先完成 Backend (Laravel) 的部分。首先，你需要完成 Application Entry Point (Wire everything in 主程序或启动程序，类似 golang 里的 main.go) 。

Always use the best practices for Laravel and coding. think hard and use context7


## Testing (Write tests)

我要你先阅读 CLAUDE.md .

我负责做 Module 1 — User & Access Management (Auth + Roles) 。目前，我要先完成 Backend (Laravel) 的部分。首先，你需要完成 Testing (Write tests) 。

Always use the best practices for Laravel and coding. think hard and use context7


## Documentation (Add documentation)

我要你先阅读 CLAUDE.md . 

我负责做 Module 1 — User & Access Management (Auth + Roles) 。目前，我要先完成 Backend (Laravel) 的部分。首先，你需要完成 Documentation (Add documentation) 。

Add Scramble Documents. 

Always use the best practices for Laravel and coding. think hard and use context7


## Dockerize & deploy

我负责做 Module 1 — User & Access Management (Auth + Roles) 。目前，我要先完成 Backend (Laravel) 的部分。首先，你需要完成 Dockerize & deploy 。

1. Create Dockerfile
2. Setup docker-compose.yml
3. Write Makefile
4. Update README.md

Always use the best practices for Laravel and coding. think hard and use context7


## Setup Core Infrastructure

我要你先阅读 CLAUDE.md . 

我负责做 Module 1 — User & Access Management (Auth + Roles) 。目前，我要完成 Frontend (Next.js) 的部分。首先，你需要 Setup Core Infrastructure 。 

1. Setup Basic Configuration
2. Setup Logger 方便所有 modules 使用

Always use the best practices for Next.js (App Router) and coding. think hard and use context7


## Build Web Design

根据 CLAUDE.md 中的所有 modules 构建一个路由界面先。
除了 Module 1 — User & Access Management (Auth + Roles) ， 其余 modules 界面只需能路由到其他界面的元素就可以了。

references: 
1. 查看 backend folder 里的 App folder 里的所有文件。

你需要构建的界面是：
1. 用户系统主界面 (不需要登入可观看) 和 管理系统主界面（只能 “admin” 登入后才能看）
2. 登入界面给所有 User roles 根据 role 决定路由到 用户系统主界面 (role 为 "member" 或 "trainer") 或 管理系统主界面 (role 为 "admin")
3. 注册界面给 User role 为 ("member" / "trainer")，要让他们做选择是 ("member" / "trainer")
4. ("member" / "trainer") 登入到 用户系统主界面 之后，要提供设置按钮，当点击 设置按钮， 提供一个界面让用户设置最基础的个人信息。
5. "admin" 登入到 管理系统主界面 之后，要提供设置按钮，当点击 设置按钮， 提供一个界面让用户 "admin" 可以设置基础的个人信息，不能与用户系统主界面的设置界面一致，因为它们是不同系统的界面。
6. 用户系统主界面 和 管理系统主界面 都采用左边纵轴的 navigation 的模式（在电脑模式）。注意要可伸缩
7. 注意要从手机界面开始，兼容 手机和电脑

Always use the best practices for Next.js (App Router) and coding. think hard and use context7


## Dockerize & deploy

我负责做 Module 1 — User & Access Management (Auth + Roles) 。目前，我要完成 Frontend (NextJS) 的部分。首先，你需要完成 Dockerize & deploy 。

1. Create Dockerfile
2. Combine Frontend (NextJS) 的部分 into docker-compose.yml
3. Combine Frontend (NextJS) 的部分 into Makefile
4. Update README.md

Always use the best practices for Next.js (App Router) and coding. think hard and use context7