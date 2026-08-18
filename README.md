# Traky

Hierarchical team & workforce management platform — Admin → Manager → Employee.

Phase 1 covers: monorepo + Docker tooling, full domain schema (with future-phase
tables scaffolded), JWT auth with Redis-backed refresh tokens, role-based APIs
for orgs/users/projects/tasks, and a React frontend with role-guarded
dashboards, org/user management, a kanban project board, and a my-tasks view.

## Stack

- **Backend:** Fastify 5, TypeScript (strict), Drizzle ORM (node-postgres), Redis (ioredis), Zod validation, `@fastify/jwt`, pino logging.
- **Frontend:** Vite, React 18, TypeScript (strict), TanStack Query, Zustand, React Router v6, Tailwind CSS, react-hook-form + zod.
- **Infra:** Postgres 16 and Redis 7 via Docker Compose.

## Project layout

```
traky/
├── docker-compose.yml
├── backend/     # Fastify API — src/modules/{auth,organizations,users,projects,tasks}
└── frontend/    # Vite React app — src/features/{auth,admin,projects,tasks,dashboard}
```

## Prerequisites

- Node.js 20+
- Docker (for Postgres + Redis)

## Setup

From the `traky/` root:

```bash
# 1. Start Postgres + Redis
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env
# edit .env and set real random values for JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
npm install
npm run db:migrate
npm run db:seed        # optional — creates demo org/users/projects/tasks
npm run dev             # http://localhost:4100

# 3. Frontend (in a new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev             # http://localhost:5173
```

> Ports: Postgres and Redis are mapped to host ports **5442** and **6389**
> (not the defaults 5432/6379) in `docker-compose.yml` to avoid clashing with
> other local projects. The backend API listens on port **4100** for the same
> reason. Adjust freely if these are clear on your machine.

### Seeded accounts

`npm run db:seed` (from `backend/`) creates one demo organization:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@traky.dev` | `Admin@123` |
| Manager | `manager1@traky.dev`, `manager2@traky.dev` | `Manager@123` |
| Employee | `ethan@traky.dev`, `emma@traky.dev`, `ezra@traky.dev`, `ivy@traky.dev`, `ian@traky.dev`, `iris@traky.dev` | `Employee@123` |

Or register a fresh organization from the frontend's "Create your organization" screen.

## Auth model

- Access token: 15-minute JWT, kept in memory (Zustand store), sent as `Authorization: Bearer`.
- Refresh token: 7-day opaque token in an httpOnly cookie, allow-listed in Redis (`refresh:<token>` → `{userId}`). Rotated on every refresh; deleted on logout — making it fully revocable server-side.
- Every list/detail query is scoped by `organization_id` at the SQL level (multi-tenant isolation), with defense-in-depth checks (`assertSameOrg`, `assertOwnTeamResource`) on top. A manager can never read another manager's projects/tasks/team, even with a crafted request — verified with cross-tenant and cross-manager smoke tests during development.

## API

REST, versioned under `/api/v1`, consistent envelope: `{ success, data, error }`.
List endpoints are paginated (`page`, `pageSize` query params).

Key routes:

- `POST /auth/register-org`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- `GET/PATCH /organizations/me`
- `POST /users/managers`, `POST /users/employees`, `GET /users`, `GET /users/my-team`, `PATCH /users/:id`, `PATCH /users/:id/assign-manager`
- `POST/GET/PATCH/DELETE /projects`, `/projects/:id`
- `POST/GET/PATCH/DELETE /tasks`, `/tasks/:id`, `PATCH /tasks/:id/status`, `/tasks/:id/comments`

## Database schema

`organizations`, `users` (role enum + self-referencing `manager_id`), `projects`,
`tasks`, `task_comments` are live in Phase 1. `attendance_logs`, `break_logs`,
`daily_updates`, and `activities` tables are already migrated (schema only, no
routes yet) so Phase 2 can bolt on attendance/EOD-updates/notifications without
a breaking migration. Every table has `created_at`/`updated_at`/`deleted_at`
(soft delete) and indexes on FKs and `(organization_id, ...)` composite lookups.

## What Phase 2 should tackle next

1. **Attendance** — punch in/out and break logging APIs against the existing `attendance_logs`/`break_logs` tables, plus an employee-facing punch clock UI.
2. **Daily updates** — EOD submission API + manager-facing digest view, using the existing `daily_updates` table.
3. **Performance dashboards** — real analytics (completion rates, on-time %, workload per employee) for admin/manager, replacing today's simple counters.
4. **Notifications** — surface the `activities` table as an in-app notification feed (task assigned, status changed, member added), likely via WebSockets/SSE.
5. **Real-time team chat** — Socket-based, scoped per team/project.
6. **Manager → Admin member requests** — a real "request new team member" flow (mentioned in the role description but intentionally not built in Phase 1).
7. Token hardening: move the access token refresh loop to a silent background timer instead of purely reactive 401-triggered refresh; consider short-lived CSRF protection on the refresh cookie route.
