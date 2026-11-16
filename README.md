# Amphi

Amphi is a university social platform for course communities, discussions, and study resources. It is a Turborepo monorepo with a **Spring Boot** REST API (`apps/api`) and a **Next.js** web client (`apps/web`), plus shared workspace packages.

## What’s inside

| Path | Description |
| --- | --- |
| `apps/api` | Spring Boot (Java, Gradle) REST/JSON API, SQLite + JPA/Hibernate, JWT auth, Springdoc/Swagger |
| `apps/web` | Next.js (App Router) client using shadcn/ui + Tailwind CSS v4, consumes the API |
| `apps/docs` | Next.js app (template workspace app) |
| `packages/ui` | Shared React component library (`@repo/ui`) |
| `packages/eslint-config` | Shared ESLint config (`@repo/eslint-config`) |
| `packages/typescript-config` | Shared TypeScript configs (`@repo/typescript-config`) |
| `docs/` | Project documentation (architecture, diagrams) |

For a deeper dive into system design, modules, data model, and flows, see **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

## Tech stack

- **Monorepo:** Turborepo, pnpm workspaces (`pnpm@11.25.0`, Node `>=24`)
- **API:** Java (Gradle toolchain 27), Spring Boot `4.1.2`, Spring Web/Data JPA/Security/Validation, SQLite (`org.xerial:sqlite-jdbc`, Hibernate community dialect), JJWT, Springdoc OpenAPI (`springdoc-openapi-starter-webmvc-ui`)
- **Web:** Next.js `16.3.8`, React `19`, TypeScript, Tailwind CSS v4, shadcn/ui (Radix), `lucide-react`
- **Auth:** Stateless JWT (`Authorization: Bearer <token>`), BCrypt passwords, role-based access (`STUDENT`, `PROFESSOR`, `ADMIN`)

## Prerequisites

- **Node.js** `>= 24` and **pnpm** `11.x` (repo pins `packageManager: pnpm@11.25.0`)
- **JDK 27** (required by `apps/api` Gradle toolchain; Gradle wrapper is included)
- macOS/Linux shell for the included scripts/commands (Windows: use WSL or adapt commands)

> No separate database server is required: the API uses a local SQLite file at `apps/api/data/amphi.db` (created/updated automatically via Hibernate `ddl-auto=update`).

## Quick start (local development)

### 1. Install dependencies

From the repository root:

```bash
pnpm install
```

### 2. Configure environment

**API** (`apps/api/src/main/resources/application.properties` provides dev defaults):
- Runs on **`http://localhost:8080`**
- SQLite DB: `jdbc:sqlite:./data/amphi.db` (relative to `apps/api` working dir)
- Dev JWT secret/expiry are set by default — **override `app.jwt.secret` (and related settings) for any non-local use**

**Web** (copy the example and adjust if needed):

```bash
cp apps/web/.env.example apps/web/.env.local
```

`apps/web/.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

**Admin bootstrap (optional, for creating the first/admin user):** copy the root example and fill credentials (see [Create an admin user](#create-an-admin-user)):

```bash
cp .env.example .env
# edit APP_ADMIN_EMAIL / APP_ADMIN_PASSWORD
```

### 3. Run everything

From the repository root:

```bash
pnpm dev
```

This runs `turbo run dev` across workspace apps with a `dev` task, including:
- **`web`**: Next.js dev server on **`http://localhost:3000`** (`next dev --port 3000`)
- **`api`**: Spring Boot via **`./gradlew bootRun`** on **`http://localhost:8080`**
- **`docs`**: Next.js dev server (template app; port as configured by that app)

> `apps/api/dev` is a long-running task (declared persistent in Turbo). Use separate terminals/filters if you want to run apps individually.

Run a single app:

```bash
pnpm exec turbo run dev --filter=web
pnpm exec turbo run dev --filter=api
# or from within the app directory:
# cd apps/api && ./gradlew bootRun
# cd apps/web && pnpm dev
```

## Create an admin user

Registration creates `STUDENT` accounts by default. Use the bootstrap command to **create** an admin or **update** an existing user’s password and set role to `ADMIN` (no web server started).

From the repository root (reads root `.env` via `dotenv-cli` + Turbo):

```bash
# .env must define APP_ADMIN_EMAIL and APP_ADMIN_PASSWORD (see .env.example)
pnpm create-admin
```

Supported root `.env` keys (aliases accepted): `APP_ADMIN_EMAIL`/`APP_ADMIN_USERNAME`, `APP_ADMIN_PASSWORD`, optional `APP_ADMIN_FIRST_NAME`/`APP_ADMIN_LAST_NAME` (also `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, etc.).

Alternatives:
- **API-local config:** `cp apps/api/admin.properties.example apps/api/admin.properties` then run `cd apps/api && ./gradlew createAdmin` (or set `apps/api/.env`-style properties; see `apps/api/src/main/resources/application.properties` `spring.config.import`)
- **Pass directly:** `cd apps/api && ./gradlew createAdmin -PadminEmail=admin@example.com -PadminPassword='strong-password'`

> “Username” is the login **email** in this app.

## API documentation (Swagger / OpenAPI)

With the API running:
- **Swagger UI:** [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html) (also `/swagger-ui.html`)
- **OpenAPI JSON:** [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

To call protected endpoints in Swagger UI: obtain a JWT via `POST /api/auth/login` or `POST /api/auth/register`, click **Authorize**, and provide the bearer token (`bearerAuth`).

## Build, test, and checks

From the repository root (Turbo):

```bash
pnpm build        # turbo run build
pnpm lint         # turbo run lint
pnpm check-types  # turbo run check-types
pnpm format       # prettier --write "**/*.{ts,tsx,md}"
```

Per app:

```bash
# API (Gradle)
cd apps/api
./gradlew build
./gradlew test
./gradlew compileJava

# Web (Next.js)
pnpm --filter web build
pnpm --filter web lint
pnpm --filter web check-types   # next typegen && tsc --noEmit
```

## Project structure (high level)

```text
.
├─ apps/
│  ├─ api/                 # Spring Boot REST API (Gradle, SQLite)
│  │  ├─ src/main/java/me/matta/amphi/
│  │  │  ├─ auth/          # register/login, DTOs
│  │  │  ├─ user/          # users, roles, admin user management
│  │  │  ├─ community/     # communities (public/private), ownership
│  │  │  ├─ membership/    # join/leave/members
│  │  │  ├─ invitation/    # private-community invitation codes
│  │  │  ├─ post/          # community posts
│  │  │  ├─ comment/       # comments & replies (threaded via parentId)
│  │  │  ├─ reaction/      # post/comment likes
│  │  │  ├─ studyresource/ # study materials (global or community-scoped)
│  │  │  └─ common/        # security/JWT, OpenAPI, exceptions, bootstrap
│  │  └─ src/main/resources/application.properties
│  ├─ web/                 # Next.js client (App Router, shadcn/ui)
│  │  ├─ app/              # routes/pages (home, auth, communities, posts, resources, admin)
│  │  ├─ components/       # UI, navbar, auth provider
│  │  └─ lib/              # API client, auth helpers, types
│  └─ docs/                # Next.js template app (workspace)
├─ packages/               # shared eslint/tsconfig/ui
├─ docs/                   # project documentation (architecture)
├─ turbo.json              # Turborepo pipeline (dev/build/lint/check-types/create-admin)
├─ pnpm-workspace.yaml
└─ .env.example            # root env template (admin bootstrap)
```

## Key features & behavior

- **Users & roles:** `STUDENT`, `PROFESSOR`, `ADMIN`; public registration defaults to `STUDENT`; admin user management via API/UI (`/admin`) for listing users and changing roles.
- **Auth:** register/login issue JWT; web stores token client-side and validates via `/api/users/me`.
- **Communities:** create/list/get/update/delete; public/private; ownership and membership rules; join/leave; member management; invitation code flow for private communities.
- **Posts & discussions:** posts within communities; comments with replies (flat API with `parentId`), likes on posts/comments; edit/delete with server-side permission checks (author/owner/admin as applicable). Some deletes have constraints (e.g. comments with replies must be removed in order).
- **Study resources:** create/list/get/update/delete with optional community scope and attachment reference.
- **Cross-cutting:** DTO-based responses, validation, centralized exception handling, CORS configured for local web origins, stateless security filter chain.

## Web routes (client)

- `/` — landing/home
- `/login`, `/register` — authentication
- `/communities`, `/communities/[id]` — browse/create/join/manage communities and posts
- `/communities/[id]/posts/[postId]` — post detail, comments/replies/likes
- `/resources` — study resources
- `/admin` — admin-only user/role management

## Notes & troubleshooting

- **CORS:** API allows `http://localhost:3000` and `http://localhost:3001` (see `SecurityConfig`); update if using different origins.
- **DB location:** `apps/api/data/amphi.db` (gitignored patterns in `apps/api/.gitignore`). Deleting it resets local data (schema recreated on next run).
- **JWT secret:** default in `application.properties` is for development only; override via configuration/env for real deployments.
- **Monorepo tasks:** `pnpm dev` runs all packages that define `dev` (including `apps/docs`). Filter with Turbo if you only need API+web.

## Further reading

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — components, backend/frontend architecture, data model, and key flows (with diagrams)
- Swagger UI at `/swagger-ui/index.html` for the live API contract
